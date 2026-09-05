from rapidfuzz import fuzz
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.reconciliation import Settlement, BankTransaction, ReconciliationResult
from app.services.ai_agent import AIAgent
from app.core.logger import logger

class ReconEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def run_reconciliation(self):
        logger.info("Starting reconciliation engine run")
        # Fetch unmatched settlements
        stmt_setl = select(Settlement).filter(Settlement.status != "reconciled")
        res_setl = await self.db.execute(stmt_setl)
        unmatched_settlements = list(res_setl.scalars().all())

        # Fetch unmatched bank transactions
        stmt_btx = select(BankTransaction).outerjoin(ReconciliationResult, BankTransaction.id == ReconciliationResult.bank_transaction_id).filter(ReconciliationResult.id == None)
        res_btx = await self.db.execute(stmt_btx)
        unmatched_bank_txs = list(res_btx.scalars().all())

        results = []

        # 1. Exact Match (Amount + UTR)
        for setl in list(unmatched_settlements):
            for btx in list(unmatched_bank_txs):
                if setl.net_amount == btx.amount and setl.utr in btx.description:
                    if self.verify_match([btx.amount], setl.net_amount):
                        res = ReconciliationResult(
                            settlement_id=setl.id,
                            bank_transaction_id=btx.id,
                            status="MATCHED",
                            match_type="EXACT",
                            confidence_score=1.0
                        )
                        results.append(res)
                        setl.status = "reconciled"
                        self.db.add(res)
                        unmatched_settlements.remove(setl)
                        unmatched_bank_txs.remove(btx)
                        break

        # 2. Fuzzy Match
        for setl in list(unmatched_settlements):
            best_match = None
            best_score = 0
            for btx in unmatched_bank_txs:
                if setl.net_amount == btx.amount:
                    score = fuzz.partial_ratio(setl.utr, btx.description)
                    if score > 85 and score > best_score:
                        best_score = score
                        best_match = btx
            
            if best_match:
                if self.verify_match([best_match.amount], setl.net_amount):
                    res = ReconciliationResult(
                        settlement_id=setl.id,
                        bank_transaction_id=best_match.id,
                        status="MATCHED",
                        match_type="FUZZY",
                        confidence_score=best_score / 100.0
                    )
                    results.append(res)
                    setl.status = "reconciled"
                    self.db.add(res)
                    unmatched_settlements.remove(setl)
                    unmatched_bank_txs.remove(best_match)

        # 3. AI Agent Match
        candidates = [
            {"id": b.id, "amount": b.amount, "description": b.description, "date": str(b.date)}
            for b in unmatched_bank_txs
        ]
        
        for setl in list(unmatched_settlements):
            target = {
                "id": setl.id,
                "net_amount": setl.net_amount,
                "utr": setl.utr,
                "created_at": str(setl.created_at)
            }
            
            proposals = await AIAgent.resolve_exception(target, candidates)
            
            if proposals and len(proposals) > 0:
                proposal = proposals[0]
                proposed_tx_ids = proposal.bank_transaction_ids
                
                proposed_amounts = [c["amount"] for c in candidates if c["id"] in proposed_tx_ids]
                
                if len(proposed_amounts) == len(proposed_tx_ids) and self.verify_match(proposed_amounts, setl.net_amount):
                    for tx_id in proposed_tx_ids:
                        res = ReconciliationResult(
                            settlement_id=setl.id,
                            bank_transaction_id=tx_id,
                            status="MATCHED",
                            match_type="AI",
                            confidence_score=0.9,
                            ai_reasoning=proposal.reasoning
                        )
                        results.append(res)
                        self.db.add(res)
                        
                        candidates = [c for c in candidates if c["id"] != tx_id]
                        btx_obj = next((b for b in unmatched_bank_txs if b.id == tx_id), None)
                        if btx_obj: unmatched_bank_txs.remove(btx_obj)
                    
                    setl.status = "reconciled"
                    unmatched_settlements.remove(setl)
                else:
                    logger.warning(f"AI Verification Failed for Settlement {setl.id}. Proposed: {proposed_tx_ids}")

        await self.db.commit()
        logger.info(f"Reconciliation engine finished. Reconciled: {len(results)}")
        return {"reconciled": len(results), "remaining_settlements": len(unmatched_settlements)}

    def verify_match(self, bank_amounts, target_net_amount):
        total_bank_deposit = round(sum(bank_amounts), 2)
        return total_bank_deposit == round(target_net_amount, 2)
