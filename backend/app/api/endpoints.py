from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.session import get_db
from app.models.finance import Goal, FinanceTransaction, UserProfile, Account
from app.schemas.finance import GoalCreate, GoalResponse, TransactionCreate, TransactionResponse, FinancialSummary, AccountCreate, AccountResponse
from app.schemas.reconciliation import ReconciliationBatchResponse
from app.services.synthetic_controller import build_synthetic_batch
from app.core.logger import logger
from datetime import datetime

router = APIRouter()


@router.get("/reconciliation/demo", response_model=ReconciliationBatchResponse)
async def get_demo_reconciliation():
    """Return the deterministic Track 04 batch used by the control-tower prototype."""
    return build_synthetic_batch()


@router.post("/reconciliation/run", response_model=ReconciliationBatchResponse)
async def run_demo_reconciliation():
    """Run the deterministic controller against the synthetic source set."""
    return build_synthetic_batch()

@router.get("/summary", response_model=FinancialSummary)
async def get_summary(db: AsyncSession = Depends(get_db)):
    # 1. Get User Profile (Mock if doesn't exist)
    res_prof = await db.execute(select(UserProfile).limit(1))
    profile = res_prof.scalar_one_or_none()
    if not profile:
        profile = UserProfile(monthly_income=5000.0, fixed_bills=2000.0)
        db.add(profile)
        await db.commit()
    
    # 2. Get Goals
    res_goals = await db.execute(select(Goal).order_by(Goal.created_at.desc()))
    goals = list(res_goals.scalars().all())

    # 3. Get Recent Transactions
    res_txs = await db.execute(select(FinanceTransaction).order_by(FinanceTransaction.created_at.desc()).limit(10))
    transactions = list(res_txs.scalars().all())

    # 4. Get Accounts and calculate Net Worth
    res_accs = await db.execute(select(Account).order_by(Account.created_at.desc()))
    accounts = list(res_accs.scalars().all())
    
    total_net_worth = 0
    for acc in accounts:
        # Liabilities are assumed negative if entered that way, or we enforce it
        # Actually, let's just sum them. We will enforce negative values for loans/mortgages in the UI/endpoint
        if acc.account_type in ["Credit cards", "Loans", "Mortgages"]:
            total_net_worth -= abs(acc.balance)
        else:
            total_net_worth += acc.balance

    # 5. Calculate "Safe to Spend"
    # Simplified math: (Income - Fixed Bills - Goal Targets for this month) / 4 weeks
    total_goal_needed = 0
    for g in goals:
        if g.deadline:
            months_left = max((g.deadline.year - datetime.now().year) * 12 + g.deadline.month - datetime.now().month, 1)
            total_goal_needed += (g.target_amount - g.current_saved) / months_left
        else:
            total_goal_needed += (g.target_amount - g.current_saved) / 12 # Assume 1 year if no deadline

    monthly_discretionary = profile.monthly_income - profile.fixed_bills - total_goal_needed
    weekly_safe = max(monthly_discretionary / 4.33, 0) # 4.33 weeks per month

    return FinancialSummary(
        monthly_income=profile.monthly_income,
        fixed_bills=profile.fixed_bills,
        weekly_safe_to_spend=round(weekly_safe, 2),
        total_net_worth=round(total_net_worth, 2),
        accounts=accounts,
        goals=goals,
        recent_transactions=transactions
    )

@router.post("/goals", response_model=GoalResponse)
async def create_goal(goal_in: GoalCreate, db: AsyncSession = Depends(get_db)):
    new_goal = Goal(
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        deadline=goal_in.deadline
    )
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)
    return new_goal

@router.post("/transactions", response_model=TransactionResponse)
async def log_transaction(tx_in: TransactionCreate, db: AsyncSession = Depends(get_db)):
    new_tx = FinanceTransaction(
        amount=tx_in.amount,
        merchant=tx_in.merchant,
        category=tx_in.category,
        purpose=tx_in.purpose
    )
    db.add(new_tx)
    await db.commit()
    await db.refresh(new_tx)
    return new_tx

@router.post("/accounts", response_model=AccountResponse)
async def create_account(acc_in: AccountCreate, db: AsyncSession = Depends(get_db)):
    new_acc = Account(
        name=acc_in.name,
        account_type=acc_in.account_type,
        balance=acc_in.balance
    )
    db.add(new_acc)
    await db.commit()
    await db.refresh(new_acc)
    return new_acc
