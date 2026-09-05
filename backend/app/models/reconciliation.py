from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    fee = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    settlement_id = Column(String, ForeignKey("settlements.id"), nullable=True)
    status = Column(String, default="captured")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    settlement = relationship("Settlement", back_populates="payments")

class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String, primary_key=True, index=True)
    gross_amount = Column(Float, nullable=False)
    net_amount = Column(Float, nullable=False)
    fee = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    utr = Column(String, index=True, nullable=True)
    status = Column(String, default="processed")
    created_at = Column(DateTime, default=datetime.utcnow)

    payments = relationship("Payment", back_populates="settlement")
    reconciliation_result = relationship("ReconciliationResult", back_populates="settlement", uselist=False)

class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, default="CREDIT")
    
    reconciliation_result = relationship("ReconciliationResult", back_populates="bank_transaction", uselist=False)

class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    settlement_id = Column(String, ForeignKey("settlements.id"), nullable=True)
    bank_transaction_id = Column(String, ForeignKey("bank_transactions.id"), nullable=True)
    status = Column(String, default="MATCHED")
    match_type = Column(String)
    confidence_score = Column(Float)
    ai_reasoning = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    settlement = relationship("Settlement", back_populates="reconciliation_result")
    bank_transaction = relationship("BankTransaction", back_populates="reconciliation_result")
