from sqlalchemy.orm import Session

from app.config import default_policy
from app.models import PolicyConfig


def get_policy(db: Session) -> dict:
    policy = db.query(PolicyConfig).first()
    if policy:
        return policy.policy
    policy = PolicyConfig(policy=default_policy())
    db.add(policy)
    db.flush()
    return policy.policy


def update_policy(db: Session, payload: dict) -> dict:
    policy = db.query(PolicyConfig).first()
    if not policy:
        policy = PolicyConfig(policy=default_policy())
        db.add(policy)
    merged = {**default_policy(), **payload}
    policy.policy = merged
    db.flush()
    return merged


def evaluate_policy_window(
    days_since_order: int,
    policy: dict,
    full_window_override: int | None = None,
) -> str:
    """
    Returns 'full', 'partial', or 'none'.

    If a product's return_window_days is provided via full_window_override it
    takes precedence over the global policy refund_window_days.
    """
    full_window = full_window_override if full_window_override is not None else int(policy["refund_window_days"])
    if days_since_order <= full_window:
        return "full"
    if days_since_order <= int(policy["partial_window_days"]):
        return "partial"
    return "none"
