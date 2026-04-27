import random

from faker import Faker
from sqlalchemy.orm import Session

from app.models import Complaint, User
from app.services.decision_service import decide
from app.services.user_memory_service import get_or_create_user


fake = Faker()
PRODUCTS = ["Wireless Earbuds", "Smartwatch", "Coffee Maker", "Gaming Mouse", "Monitor"]


def seed_mock_data(db: Session, size: int = 50) -> None:
    if db.query(Complaint).count() > 0:
        return
    for i in range(size):
        user_id = f"U{random.randint(1000, 1020)}"
        payload = {
            "user_id": user_id,
            "text": fake.sentence(nb_words=20),
            "product": random.choice(PRODUCTS),
            "price": round(random.uniform(20, 500), 2),
            "total_orders": random.randint(1, 12),
            "days_since_order": random.randint(1, 80),
        }
        user = get_or_create_user(db, user_id, payload["total_orders"])
        result = decide(db, payload, user)
        complaint = Complaint(
            user_id=user.id,
            text=payload["text"],
            product=payload["product"],
            price=payload["price"],
            days_since_order=payload["days_since_order"],
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
        if i % 10 == 0:
            db.flush()
    db.commit()
