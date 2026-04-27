from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ComplaintSubmitRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=80)
    text: str = Field(min_length=10, max_length=2000)
    product: str = Field(min_length=1, max_length=120)
    product_id: int | None = None
    price: float = Field(gt=0)
    total_orders: int = Field(default=1, ge=1)
    days_since_order: int = Field(default=10, ge=0)


class CustomerDecisionResponse(BaseModel):
    complaint_id: int
    decision: Literal["APPROVE", "REJECT", "PARTIAL"]
    explanation: str


class CaseOut(BaseModel):
    id: int
    user_id: str
    product_id: int | None
    text: str
    product: str
    price: float
    decision: str
    reason: str
    sentiment_score: float
    anger_score: float
    genuineness_score: float
    fraud_score: float
    confidence: float
    timestamp: datetime


class AnalyticsOut(BaseModel):
    total_refunds: int
    refund_rate: float
    fraud_cases_detected: int
    avg_sentiment_score: float
    refunds_over_time: list[dict]
    decision_distribution: list[dict]
    top_refunded_products: list[dict]


class PolicyOut(BaseModel):
    refund_window_days: int
    partial_window_days: int
    partial_refund_percent: float
    sentiment_threshold: float
    fraud_threshold: float


class CaseListOut(BaseModel):
    total: int
    items: list[CaseOut]


class ProductOut(BaseModel):
    id: int
    name: str
    price: float
    stock: int
    category: str
    return_window_days: int
    is_refundable: bool


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
