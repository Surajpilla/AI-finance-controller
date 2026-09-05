from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MetricsResponse(BaseModel):
    throughput: str
    match_rate: float
    pending_exceptions: int
    total_settlements: int

class BankTransactionSchema(BaseModel):
    id: str
    date: datetime
    description: str
    amount: float
    type: str

    class Config:
        from_attributes = True

class SettlementSchema(BaseModel):
    id: str
    gross_amount: float
    net_amount: float
    fee: float
    tax: float
    utr: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReconciliationResultSchema(BaseModel):
    id: int
    settlement_id: Optional[str] = None
    bank_transaction_id: Optional[str] = None
    status: str
    match_type: str
    confidence_score: float
    ai_reasoning: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ExceptionsResponse(BaseModel):
    unmatched_settlements: List[SettlementSchema]
    unmatched_bank_txs: List[BankTransactionSchema]
    ai_matches: List[ReconciliationResultSchema]

class ReconResponse(BaseModel):
    reconciled: int
    remaining_settlements: int


class SyntheticBankLine(BaseModel):
    id: str
    date: str
    description: str
    amount: float


class SyntheticRecord(BaseModel):
    id: str
    date: str
    channel: str
    expected: float
    bank_reference: str
    status: str
    match_type: str
    confidence: float
    note: str
    exception_type: Optional[str] = None
    bank_lines: List[SyntheticBankLine]


class SyntheticBreakdown(BaseModel):
    exact: int
    rule_match: int
    split_match: int
    controller_action: int
    unresolved: int


class SyntheticMetrics(BaseModel):
    total: int
    matched: int
    exceptions: int
    match_rate: float
    throughput: str
    cash_cleared: float
    by_type: SyntheticBreakdown


class ReconciliationBatchResponse(BaseModel):
    batch_id: str
    generated_at: str
    metrics: SyntheticMetrics
    records: List[SyntheticRecord]
