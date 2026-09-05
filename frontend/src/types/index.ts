export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_saved: number;
  deadline: string | null;
  created_at: string;
}

export interface Transaction {
  id: number;
  amount: number;
  merchant: string;
  category: string;
  purpose: string | null;
  created_at: string;
}

export interface Account {
  id: number;
  name: string;
  account_type: string;
  balance: number;
  created_at: string;
}

export interface FinancialSummary {
  monthly_income: number;
  fixed_bills: number;
  weekly_safe_to_spend: number;
  total_net_worth: number;
  accounts: Account[];
  goals: Goal[];
  recent_transactions: Transaction[];
}

// Legacy reconciliation component contracts kept for backwards compatibility.
export interface Metrics {
  throughput: string;
  match_rate: number;
  pending_exceptions: number;
  total_settlements: number;
}

export interface Settlement {
  id: string;
  gross_amount: number;
  net_amount: number;
  fee: number;
  tax: number;
  utr: string | null;
  status: string;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
}
