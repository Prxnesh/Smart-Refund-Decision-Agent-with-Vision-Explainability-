import json
import logging
from collections import Counter, defaultdict
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.api.middleware import issue_token, require_admin
from app.config import settings
from app.database import get_db
from app.exports.excel_export import build_report_excel
from app.models import Complaint, Product, User
from app.schemas import (
    AnalyticsOut,
    CaseListOut,
    CaseOut,
    ChatRequest,
    ComplaintSubmitRequest,
    CustomerDecisionResponse,
    LoginRequest,
    LoginResponse,
    PolicyOut,
    ProductOut,
)
from app.services.decision_service import decide
from app.services.ollama_service import stream_chat
from app.services.policy_service import get_policy, update_policy
from app.services.user_memory_service import get_or_create_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _to_case_out(row: Complaint) -> CaseOut:
    return CaseOut(
        id=row.id,
        user_id=row.user_id,
        product_id=row.product_id,
        text=row.text,
        product=row.product,
        price=row.price,
        decision=row.decision,
        reason=row.reason,
        sentiment_score=row.sentiment_score,
        anger_score=row.anger_score,
        genuineness_score=row.genuineness_score,
        fraud_score=row.fraud_score,
        confidence=row.confidence,
        timestamp=row.timestamp,
    )


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@router.post("/admin/login", response_model=LoginResponse)
def admin_login(payload: LoginRequest):
    token = issue_token(payload.username, payload.password)
    return LoginResponse(access_token=token)


# ---------------------------------------------------------------------------
# Agent / system status  (public)
# ---------------------------------------------------------------------------

@router.get("/status")
def system_status(db: Session = Depends(get_db)):
    """Returns live health of every sub-system the frontend renders."""
    # DB stats
    total_cases = db.query(func.count(Complaint.id)).scalar() or 0
    approved = db.query(func.count(Complaint.id)).filter(Complaint.decision == "APPROVE").scalar() or 0
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.decision == "REJECT").scalar() or 0
    partial = db.query(func.count(Complaint.id)).filter(Complaint.decision == "PARTIAL").scalar() or 0
    fraud = db.query(func.count(Complaint.id)).filter(Complaint.fraud_score > 0.7).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Ollama health
    ollama_ok = False
    ollama_model = settings.ollama_model
    try:
        r = httpx.get(f"{settings.ollama_base_url}/api/tags", timeout=3.0)
        models = [m["name"] for m in r.json().get("models", [])]
        ollama_ok = any(ollama_model in m for m in models)
    except Exception:
        pass

    return {
        "db": {"status": "ok", "total_cases": total_cases, "total_users": total_users, "total_products": total_products},
        "decisions": {"approved": approved, "rejected": rejected, "partial": partial, "fraud_detected": fraud},
        "ollama": {"status": "ok" if ollama_ok else "unavailable", "model": ollama_model},
        "api": {"status": "ok", "version": "1.0.0"},
    }


# ---------------------------------------------------------------------------
# Customer-facing
# ---------------------------------------------------------------------------

@router.post("/submit-complaint", response_model=CustomerDecisionResponse)
def submit_complaint(payload: ComplaintSubmitRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, payload.user_id, payload.total_orders)
    result = decide(db, payload.model_dump(), user)
    complaint = Complaint(
        user_id=payload.user_id,
        product_id=payload.product_id,
        text=payload.text,
        product=payload.product,
        price=payload.price,
        days_since_order=payload.days_since_order,
        sentiment_score=result["sentiment_score"],
        anger_score=result["anger_score"],
        genuineness_score=result["genuineness_score"],
        fraud_score=result["fraud_score"],
        decision=result["decision"],
        reason=result["reason"],
        confidence=result["confidence"],
    )
    db.add(complaint)
    if result["decision"] in {"APPROVE", "PARTIAL"}:
        user.total_refunds += 1
    db.commit()
    db.refresh(complaint)
    return CustomerDecisionResponse(
        complaint_id=complaint.id,
        decision=complaint.decision,
        explanation=complaint.reason,
    )


@router.post("/chat")
async def chat_stream(payload: ChatRequest):
    """SSE endpoint — streams Ollama tokens as data: {"content":"..."} events."""
    messages = [m.model_dump() for m in payload.messages]

    async def event_stream():
        try:
            async for chunk in stream_chat(messages):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as exc:
            logger.error("Chat stream error: %s", exc)
            yield f"data: {json.dumps({'error': 'AI assistant is unavailable. Please try again.'})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Inventory (public — customers need it to fill the complaint form)
# ---------------------------------------------------------------------------

@router.get("/inventory", response_model=list[ProductOut])
def get_inventory(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.category, Product.name).all()


@router.get("/inventory/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---------------------------------------------------------------------------
# Admin — cases
# ---------------------------------------------------------------------------

@router.get("/admin/cases", response_model=CaseListOut, dependencies=[Depends(require_admin)])
def get_cases(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    filter_decision: str | None = None,
):
    query = db.query(Complaint).order_by(desc(Complaint.timestamp))
    if filter_decision:
        query = query.filter(Complaint.decision == filter_decision.upper())
    total = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()
    return CaseListOut(total=total, items=[_to_case_out(r) for r in rows])


@router.get("/admin/case/{case_id}", response_model=CaseOut, dependencies=[Depends(require_admin)])
def get_case(case_id: int, db: Session = Depends(get_db)):
    row = db.query(Complaint).filter(Complaint.id == case_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    return _to_case_out(row)


# ---------------------------------------------------------------------------
# Admin — analytics
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=AnalyticsOut, dependencies=[Depends(require_admin)])
def analytics(db: Session = Depends(get_db)):
    total_cases = db.query(func.count(Complaint.id)).scalar() or 0
    total_refunds = (
        db.query(func.count(Complaint.id))
        .filter(Complaint.decision.in_(["APPROVE", "PARTIAL"]))
        .scalar() or 0
    )
    fraud_cases = db.query(func.count(Complaint.id)).filter(Complaint.fraud_score > 0.7).scalar() or 0
    avg_sentiment = db.query(func.avg(Complaint.sentiment_score)).scalar() or 0.0

    rows = db.query(Complaint).all()
    by_day: dict = defaultdict(int)
    dist: Counter = Counter()
    by_product: Counter = Counter()
    for row in rows:
        by_day[row.timestamp.strftime("%Y-%m-%d")] += 1 if row.decision in {"APPROVE", "PARTIAL"} else 0
        dist[row.decision] += 1
        if row.decision in {"APPROVE", "PARTIAL"}:
            by_product[row.product] += 1

    return AnalyticsOut(
        total_refunds=total_refunds,
        refund_rate=round(total_refunds / max(total_cases, 1), 3),
        fraud_cases_detected=fraud_cases,
        avg_sentiment_score=round(float(avg_sentiment), 3),
        refunds_over_time=[{"date": d, "count": by_day[d]} for d in sorted(by_day)],
        decision_distribution=[{"name": k, "value": v} for k, v in dist.items()],
        top_refunded_products=[{"product": k, "count": v} for k, v in by_product.most_common(10)],
    )


# ---------------------------------------------------------------------------
# Admin — export
# ---------------------------------------------------------------------------

@router.get("/export-report", dependencies=[Depends(require_admin)])
def export_report(db: Session = Depends(get_db)):
    rows = db.query(Complaint).order_by(desc(Complaint.timestamp)).all()
    report_rows = [
        {
            "user_id": r.user_id,
            "product": r.product,
            "price": r.price,
            "decision": r.decision,
            "reason": r.reason,
            "fraud_score": r.fraud_score,
            "date": r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for r in rows
    ]
    content = build_report_excel(report_rows)
    name = f"refund_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )


# ---------------------------------------------------------------------------
# Admin — policy
# ---------------------------------------------------------------------------

@router.get("/admin/policy", response_model=PolicyOut, dependencies=[Depends(require_admin)])
def get_refund_policy(db: Session = Depends(get_db)):
    return PolicyOut(**get_policy(db))


@router.post("/admin/policy", response_model=PolicyOut, dependencies=[Depends(require_admin)])
def save_refund_policy(payload: PolicyOut, db: Session = Depends(get_db)):
    updated = update_policy(db, payload.model_dump())
    db.commit()
    return PolicyOut(**updated)
