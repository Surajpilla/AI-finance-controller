import json
from google import genai
from pydantic import BaseModel, Field
from typing import List
from app.core.config import settings
from app.core.logger import logger

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    logger.warning(f"Could not initialize Gemini Client: {e}")
    client = None

class MatchedTransactions(BaseModel):
    bank_transaction_ids: List[str] = Field(description="List of bank transaction IDs that map to the settlement")
    reasoning: str = Field(description="Explanation of why these transactions match")

class AIAgent:
    @staticmethod
    async def resolve_exception(target_settlement: dict, candidate_bank_txs: list):
        if not client:
            return None

        prompt = f"""
        You are an expert AI Finance Controller.
        You need to match a Razorpay Settlement to one or more Bank Transactions.
        
        Target Settlement:
        ID: {target_settlement['id']}
        Net Amount Expected: {target_settlement['net_amount']}
        UTR: {target_settlement['utr']}
        Date: {target_settlement['created_at']}
        
        Available Unmatched Bank Transactions:
        {json.dumps(candidate_bank_txs, indent=2)}
        
        Find the bank transaction(s) that match the settlement. The sum of the bank transaction amounts MUST EXACTLY equal the Net Amount Expected. The description may contain partial UTRs or other anomalies.
        """
        
        try:
            response = await client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': list[MatchedTransactions],
                    'temperature': 0.0
                },
            )
            return response.parsed
        except Exception as e:
            logger.error(f"AI Agent error: {e}")
            return None
