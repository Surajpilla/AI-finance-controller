from __future__ import annotations

from typing import Any


CHANNELS = ["Razorpay", "Stripe", "Cashfree"]
DATES = ["Sep 04, 2026", "Sep 03, 2026", "Sep 02, 2026", "Sep 01, 2026"]


def _amount_for(index: int) -> float:
    return round(4200 + ((index * 683) % 7200) + (index % 5) * 13.4, 2)


def _bank_line(index: int, amount: float, day: str, suffix: str = "") -> dict[str, Any]:
    return {
        "id": f"BNK-{7800 + index:05d}{suffix}",
        "date": day,
        "description": f"HDFC / RZP / 920{index:04d}",
        "amount": amount,
    }


def _exception(index: int, expected: float, date_label: str) -> tuple[str, str, list[dict[str, Any]]]:
    if index == 59:
        return (
            "Missing bank line",
            "Settlement is 3 days past the expected value date with no credit in the bank feed.",
            [],
        )
    if index == 60:
        return (
            "Amount variance",
            "Bank credit is ₹12.40 below the processor net; likely fee treatment or partial posting.",
            [_bank_line(index, expected - 12.4, date_label)],
        )
    if index == 61:
        return (
            "Duplicate reference",
            "Two bank lines carry the same UTR. Auto-close is blocked until one is confirmed as a duplicate.",
            [_bank_line(index, expected, date_label, "-A"), _bank_line(index, expected, date_label, "-B")],
        )
    if index == 62:
        return (
            "Timing difference",
            "Candidate credit arrived outside the T+5 settlement window; controller review required.",
            [_bank_line(index, expected, "Aug 28, 2026")],
        )
    return (
        "Unmapped fee",
        "Settlement is short by a fee line that is not mapped to the processor fee schedule.",
        [_bank_line(index, expected - 86.5, date_label)],
    )


def build_synthetic_batch() -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    for index in range(64):
        record_id = f"SET-{240901 + index:06d}"
        expected = _amount_for(index)
        date_label = DATES[index % len(DATES)]
        channel = CHANNELS[index % len(CHANNELS)]
        reference = f"RZP920{index:04d}"

        if index < 35:
            match_type = "Exact"
            note = "Amount, UTR and value date aligned within T+1."
            confidence = 1.0
            bank_reference = reference
            bank_lines = [_bank_line(index, expected, date_label)]
            status = "matched"
            exception_type = None
        elif index < 49:
            match_type = "Rule match"
            note = "Partial UTR matched with processor and amount rules."
            confidence = 0.96
            bank_reference = f"RZP / {reference[:8]}"
            bank_lines = [_bank_line(index, expected, date_label)]
            status = "matched"
            exception_type = None
        elif index < 59:
            first = round(expected * 0.58, 2)
            second = round(expected - first, 2)
            match_type = "Split match"
            note = "Two bank lines sum exactly to the settlement net amount."
            confidence = 0.93
            bank_reference = reference
            bank_lines = [_bank_line(index, first, date_label, "-A"), _bank_line(index + 1, second, date_label, "-B")]
            status = "matched"
            exception_type = None
        else:
            exception_type, note, bank_lines = _exception(index, expected, date_label)
            match_type = "Unresolved"
            confidence = 0.48
            bank_reference = reference
            status = "exception"

        records.append(
            {
                "id": record_id,
                "date": date_label,
                "channel": channel,
                "expected": expected,
                "bank_reference": bank_reference,
                "status": status,
                "match_type": match_type,
                "confidence": confidence,
                "note": note,
                "exception_type": exception_type,
                "bank_lines": bank_lines,
            }
        )

    matched = [record for record in records if record["status"] == "matched"]
    return {
        "batch_id": "BATCH-2026-09-04-01",
        "generated_at": "2026-09-04T09:42:00+05:30",
        "metrics": {
            "total": len(records),
            "matched": len(matched),
            "exceptions": len(records) - len(matched),
            "match_rate": round((len(matched) / len(records)) * 100, 1),
            "throughput": "35.6 / min",
            "cash_cleared": round(sum(record["expected"] for record in matched), 2),
            "by_type": {
                "exact": 35,
                "rule_match": 14,
                "split_match": 10,
                "controller_action": 0,
                "unresolved": 5,
            },
        },
        "records": records,
    }
