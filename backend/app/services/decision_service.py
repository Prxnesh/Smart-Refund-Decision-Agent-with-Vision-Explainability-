from app.models import Product
from app.services.fraud_service import detect_fraud
from app.services.ollama_service import generate_explanation
from app.services.policy_service import evaluate_policy_window, get_policy
from app.services.sentiment_service import analyze_text
from app.services.user_memory_service import build_user_memory


def _confidence(sentiment: float, fraud: float, policy_match: float) -> float:
    raw = (1 - fraud) * 0.4 + sentiment * 0.3 + policy_match * 0.3
    return round(min(max(raw, 0.0), 1.0), 3)


def decide(db, complaint_input: dict, user) -> dict:
    scores = analyze_text(complaint_input["text"])
    policy = get_policy(db)
    memory = build_user_memory(db, user)
    fraud_score = detect_fraud(db, complaint_input["user_id"], complaint_input["text"], memory)

    # Look up linked product if provided
    product: Product | None = None
    if complaint_input.get("product_id"):
        product = db.query(Product).filter(Product.id == complaint_input["product_id"]).first()

    # Non-refundable product → hard reject regardless of other factors
    if product and not product.is_refundable:
        reason = f"{product.name} is designated as non-refundable and cannot be returned."
        return {
            **scores,
            "fraud_score": fraud_score,
            "decision": "REJECT",
            "reason": reason,
            "confidence": 0.98,
            "policy": policy,
            "memory": memory,
        }

    # Use product's specific return window when available
    full_window_override = product.return_window_days if product else None
    window = evaluate_policy_window(complaint_input["days_since_order"], policy, full_window_override)

    if fraud_score > policy["fraud_threshold"]:
        decision, pm = "REJECT", 0.1
    elif window == "full" and scores["sentiment_score"] >= policy["sentiment_threshold"]:
        decision, pm = "APPROVE", 1.0
    elif window == "partial":
        decision, pm = "PARTIAL", 0.7
    else:
        decision, pm = "REJECT", 0.2

    reason = generate_explanation(decision, complaint_input["text"], policy)
    confidence = _confidence(scores["sentiment_score"], fraud_score, pm)

    return {
        **scores,
        "fraud_score": fraud_score,
        "decision": decision,
        "reason": reason,
        "confidence": confidence,
        "policy": policy,
        "memory": memory,
    }
