from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AccountCreate(BaseModel):
    name: str
    account_type: str
    balance: float

class AccountResponse(BaseModel):
    id: int
    name: str
    account_type: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    deadline: Optional[datetime] = None

class GoalResponse(BaseModel):
    id: int
    name: str
    target_amount: float
    current_saved: float
    deadline: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    amount: float
    merchant: str
    category: str
    purpose: str

class TransactionResponse(BaseModel):
    id: int
    amount: float
    merchant: str
    category: str
    purpose: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class FinancialSummary(BaseModel):
    monthly_income: float
    fixed_bills: float
    weekly_safe_to_spend: float
    total_net_worth: float
    accounts: List[AccountResponse]
    goals: List[GoalResponse]
    recent_transactions: List[TransactionResponse]
