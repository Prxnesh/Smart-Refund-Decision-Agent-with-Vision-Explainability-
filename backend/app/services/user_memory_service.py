from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models import Complaint, User


def get_or_create_user(db: Session, user_id: str, total_orders: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.total_orders = max(user.total_orders, total_orders)
        return user
    user = User(id=user_id, total_orders=total_orders, total_refunds=0)
    db.add(user)
    db.flush()
    return user


def build_user_memory(db: Session, user: User) -> dict:
    recent = (
        db.query(Complaint)
        .filter(Complaint.user_id == user.id)
        .order_by(desc(Complaint.timestamp))
        .limit(5)
        .all()
    )
    ratio = user.total_refunds / max(user.total_orders, 1)
    return {
        "total_orders": user.total_orders,
        "total_refunds": user.total_refunds,
        "refund_ratio": round(ratio, 3),
        "past_complaints": [c.text for c in recent],
    }
