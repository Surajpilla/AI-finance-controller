export type QueueStatus = "matched" | "exception";
export type MatchType = "Exact" | "Rule match" | "Split match" | "Controller action" | "Unresolved";
export type ExceptionType =
  | "Missing bank line"
  | "Amount variance"
  | "Duplicate reference"
  | "Timing difference"
  | "Unmapped fee";

export interface BankLine {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface ReconciliationRecord {
  id: string;
  date: string;
  channel: string;
  expected: number;
  bankReference: string;
  status: QueueStatus;
  matchType: MatchType;
  confidence: number;
  note: string;
  exceptionType?: ExceptionType;
  bankLines: BankLine[];
}

export interface BatchMetrics {
  total: number;
  matched: number;
  exceptions: number;
  matchRate: number;
  throughput: string;
  cashCleared: number;
  byType: Record<MatchType, number>;
}

const CHANNELS = ["Razorpay", "Stripe", "Cashfree"];
const DATES = ["Sep 04, 2026", "Sep 03, 2026", "Sep 02, 2026", "Sep 01, 2026"];

function amountFor(index: number) {
  return Math.round((4200 + ((index * 683) % 7200) + (index % 5) * 13.4) * 100) / 100;
}

function bankLine(index: number, amount: number, date: string, suffix = "") {
  return {
    id: `BNK-${String(7800 + index).padStart(5, "0")}${suffix}`,
    date,
    description: `HDFC / RZP / 920${String(index).padStart(4, "0")}`,
    amount,
  };
}

export function createSyntheticBatch(): ReconciliationRecord[] {
  return Array.from({ length: 64 }, (_, index) => {
    const id = `SET-${String(240901 + index).padStart(6, "0")}`;
    const expected = amountFor(index);
    const date = DATES[index % DATES.length];
    const channel = CHANNELS[index % CHANNELS.length];
    const reference = `RZP920${String(index).padStart(4, "0")}`;

    if (index < 35) {
      return {
        id,
        date,
        channel,
        expected,
        bankReference: reference,
        status: "matched",
        matchType: "Exact",
        confidence: 1,
        note: "Amount, UTR and value date aligned within T+1.",
        bankLines: [bankLine(index, expected, date)],
      };
    }

    if (index < 49) {
      return {
        id,
        date,
        channel,
        expected,
        bankReference: `RZP / ${reference.slice(0, 8)}`,
        status: "matched",
        matchType: "Rule match",
        confidence: 0.96,
        note: "Partial UTR matched with processor and amount rules.",
        bankLines: [bankLine(index, expected, date)],
      };
    }

    if (index < 59) {
      const first = Math.round((expected * 0.58) * 100) / 100;
      const second = Math.round((expected - first) * 100) / 100;
      return {
        id,
        date,
        channel,
        expected,
        bankReference: reference,
        status: "matched",
        matchType: "Split match",
        confidence: 0.93,
        note: "Two bank lines sum exactly to the settlement net amount.",
        bankLines: [bankLine(index, first, date, "-A"), bankLine(index + 1, second, date, "-B")],
      };
    }

    const exceptionMap: Record<number, { type: ExceptionType; note: string; lines: BankLine[] }> = {
      59: {
        type: "Missing bank line",
        note: "Settlement is 3 days past the expected value date with no credit in the bank feed.",
        lines: [],
      },
      60: {
        type: "Amount variance",
        note: "Bank credit is ₹12.40 below the processor net; likely fee treatment or partial posting.",
        lines: [bankLine(60, expected - 12.4, date)],
      },
      61: {
        type: "Duplicate reference",
        note: "Two bank lines carry the same UTR. Auto-close is blocked until one is confirmed as a duplicate.",
        lines: [bankLine(61, expected, date, "-A"), bankLine(61, expected, date, "-B")],
      },
      62: {
        type: "Timing difference",
        note: "Candidate credit arrived outside the T+5 settlement window; controller review required.",
        lines: [bankLine(62, expected, "Aug 28, 2026")],
      },
      63: {
        type: "Unmapped fee",
        note: "Settlement is short by a fee line that is not mapped to the processor fee schedule.",
        lines: [bankLine(63, expected - 86.5, date)],
      },
    };
    const exception = exceptionMap[index];

    return {
      id,
      date,
      channel,
      expected,
      bankReference: reference,
      status: "exception",
      matchType: "Unresolved",
      confidence: 0.48,
      note: exception.note,
      exceptionType: exception.type,
      bankLines: exception.lines,
    };
  });
}

export function getBatchMetrics(records: ReconciliationRecord[]): BatchMetrics {
  const matched = records.filter((record) => record.status === "matched");
  const byType: Record<MatchType, number> = {
    Exact: 0,
    "Rule match": 0,
    "Split match": 0,
    "Controller action": 0,
    Unresolved: 0,
  };

  matched.forEach((record) => {
    byType[record.matchType] += 1;
  });
  records.filter((record) => record.status === "exception").forEach(() => {
    byType.Unresolved += 1;
  });

  return {
    total: records.length,
    matched: matched.length,
    exceptions: records.length - matched.length,
    matchRate: Number(((matched.length / records.length) * 100).toFixed(1)),
    throughput: "35.6 / min",
    cashCleared: matched.reduce((total, record) => total + record.expected, 0),
    byType,
  };
}
