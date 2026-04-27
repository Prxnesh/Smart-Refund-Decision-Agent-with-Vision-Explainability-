from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Complaint


SUSPICIOUS_TERMS = {"chargeback", "lawyer", "scam", "fake", "refund now"}


def detect_fraud(db: Session, user_id: str, text: str, memory: dict) -> float:
    score = 0.0
    lower_text = text.lower()
    if memory["refund_ratio"] > 0.5:
        score += 0.45
    if any(term in lower_text for term in SUSPICIOUS_TERMS):
        score += 0.25
    recent_count = (
        db.query(func.count(Complaint.id))
        .filter(Complaint.user_id == user_id)
        .filter(Complaint.days_since_order <= 7)
        .scalar()
    )
    if (recent_count or 0) >= 3:
        score += 0.3
    return round(min(score, 1.0), 3)
