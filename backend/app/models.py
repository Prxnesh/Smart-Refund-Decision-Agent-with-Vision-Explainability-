from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from app.config import default_policy


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    total_orders = Column(Integer, default=0, nullable=False)
    total_refunds = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaints = relationship("Complaint", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    category = Column(String(80), nullable=False)
    return_window_days = Column(Integer, default=30, nullable=False)
    is_refundable = Column(Boolean, default=True, nullable=False)

    complaints = relationship("Complaint", back_populates="product_ref")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    text = Column(Text, nullable=False)
    product = Column(String(120), nullable=False)
    price = Column(Float, nullable=False)
    days_since_order = Column(Integer, default=10, nullable=False)

    sentiment_score = Column(Float, default=0.0)
    anger_score = Column(Float, default=0.0)
    genuineness_score = Column(Float, default=0.0)
    fraud_score = Column(Float, default=0.0)

    decision = Column(String(16), nullable=False)
    reason = Column(Text, nullable=False)
    confidence = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="complaints")
    product_ref = relationship("Product", back_populates="complaints")


class PolicyConfig(Base):
    __tablename__ = "policy_config"

    id = Column(Integer, primary_key=True)
    policy = Column(JSON, default=default_policy, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
