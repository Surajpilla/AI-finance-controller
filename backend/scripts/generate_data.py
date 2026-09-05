import random
import uuid
import datetime
import asyncio
from app.db.session import AsyncSessionLocal, engine
from app.models.reconciliation import Payment, Settlement, BankTransaction, Base

async def generate_data():
    # Clear existing data using async engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    settlements = []
    payments = []
    bank_transactions = []
    
    total_payments = 120
    num_settlements = 5
    payments_per_settlement = total_payments // num_settlements
    
    current_time = datetime.datetime.now(datetime.UTC)

    for i in range(num_settlements):
        settlement_id = f"setl_{uuid.uuid4().hex[:14]}"
        utr = f"UTR{random.randint(1000000000, 9999999999)}"
        
        gross_amount = 0.0
        total_fee = 0.0
        total_tax = 0.0
        
        for j in range(payments_per_settlement):
            pay_amount = round(random.uniform(500.0, 5000.0), 2)
            pay_fee = round(pay_amount * 0.02, 2)
            pay_tax = round(pay_fee * 0.18, 2)
            
            payment = Payment(
                id=f"pay_{uuid.uuid4().hex[:14]}",
                amount=pay_amount,
                fee=pay_fee,
                tax=pay_tax,
                settlement_id=settlement_id,
                status="settled",
                created_at=current_time - datetime.timedelta(days=i*2)
            )
            payments.append(payment)
            
            gross_amount += pay_amount
            total_fee += pay_fee
            total_tax += pay_tax
            
        net_amount = round(gross_amount - total_fee - total_tax, 2)
        
        settlement = Settlement(
            id=settlement_id,
            gross_amount=round(gross_amount, 2),
            net_amount=net_amount,
            fee=round(total_fee, 2),
            tax=round(total_tax, 2),
            utr=utr,
            status="processed",
            created_at=current_time - datetime.timedelta(days=i*2)
        )
        settlements.append(settlement)
        
        if i == 0:
            desc = f"RAZORPAY SETTLEMENT {utr}"
            bank_tx = BankTransaction(
                id=f"btxn_{uuid.uuid4().hex[:10]}",
                date=settlement.created_at + datetime.timedelta(days=1),
                description=desc,
                amount=net_amount,
                type="CREDIT"
            )
            bank_transactions.append(bank_tx)
        elif i == 1:
            desc = f"RZPY SETL {utr[:5]}..."
            bank_tx = BankTransaction(
                id=f"btxn_{uuid.uuid4().hex[:10]}",
                date=settlement.created_at + datetime.timedelta(days=1),
                description=desc,
                amount=net_amount,
                type="CREDIT"
            )
            bank_transactions.append(bank_tx)
        elif i == 2:
            pass
        elif i == 3:
            desc = f"NEFT-RZPY-{utr}"
            bank_tx = BankTransaction(
                id=f"btxn_{uuid.uuid4().hex[:10]}",
                date=settlement.created_at + datetime.timedelta(days=5),
                description=desc,
                amount=net_amount,
                type="CREDIT"
            )
            bank_transactions.append(bank_tx)
        elif i == 4:
            split_amount_1 = round(net_amount / 2, 2)
            split_amount_2 = round(net_amount - split_amount_1, 2)
            
            bank_tx1 = BankTransaction(
                id=f"btxn_{uuid.uuid4().hex[:10]}",
                date=settlement.created_at + datetime.timedelta(days=1),
                description=f"RZPY PART {utr}",
                amount=split_amount_1,
                type="CREDIT"
            )
            bank_tx2 = BankTransaction(
                id=f"btxn_{uuid.uuid4().hex[:10]}",
                date=settlement.created_at + datetime.timedelta(days=2),
                description=f"RZPY REM {utr}",
                amount=split_amount_2,
                type="CREDIT"
            )
            bank_transactions.append(bank_tx1)
            bank_transactions.append(bank_tx2)

    async with AsyncSessionLocal() as session:
        session.add_all(settlements)
        session.add_all(payments)
        session.add_all(bank_transactions)
        await session.commit()
    print("Synthetic data generated successfully.")

if __name__ == "__main__":
    asyncio.run(generate_data())
