from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.models.base import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_saved = Column(Float, default=0.0)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=False)
    category = Column(String, nullable=False)
    purpose = Column(String, nullable=True) # The "Why"
    created_at = Column(DateTime, default=datetime.utcnow)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    monthly_income = Column(Float, default=0.0)
    fixed_bills = Column(Float, default=0.0)

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    account_type = Column(String, nullable=False) # Checkings, Savings, Credit cards, Loans, Investments, Mortgages
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
