# ReconCore — AI Finance Controller

Track 04 prototype for closing a finance-ops reconciliation loop.

## The pain

Finance teams lose time joining processor settlement exports to bank statements and ledger lines. Timing differences, partial UTRs, split deposits, duplicate references, and fee treatment turn a simple cash close into manual investigation. The costly failure is not only the work; it is an unexplained cash position when the close is done.

## The product move

ReconCore normalizes the source set, applies three transparent match tiers, reports throughput and measured match rate, and routes only unsafe or under-evidenced matches to a typed exception queue. Exception actions are presented as controller decisions so the operator can close the loop with an audit trail instead of accepting an opaque AI guess.

The demo uses 64 synthetic settlements:

- 35 exact matches
- 14 partial-reference rule matches
- 10 constrained split matches
- 5 unresolved exceptions with explicit reasons

That produces 59 matched records, 5 open exceptions, and a 92.2% match rate.

## Run locally

```bash
npm run dev
```

The page is self-contained for the demo and does not require the legacy personal-finance API to render the control tower.
