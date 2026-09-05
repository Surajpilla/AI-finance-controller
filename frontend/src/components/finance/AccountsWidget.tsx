import { useState } from "react";
import { mutate } from "swr";
import { FinancialSummary } from "@/types";

interface Props {
  summary: FinancialSummary | undefined;
  apiUrl: string;
}

const ACCOUNT_TYPES = [
  "Checkings",
  "Savings",
  "Credit cards",
  "Loans",
  "Investments",
  "Mortgages"
];

export function AccountsWidget({ summary, apiUrl }: Props) {
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0]);
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  if (!summary) return <div className="h-64 bg-[#18181b] animate-pulse rounded-xl" />;

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${apiUrl}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          account_type: accountType, 
          balance: parseFloat(balance) 
        }),
      });
      setName("");
      setBalance("");
      mutate(`${apiUrl}/summary`);
    } finally {
      setLoading(false);
    }
  };

  const assets = summary.accounts.filter(a => !["Credit cards", "Loans", "Mortgages"].includes(a.account_type));
  const liabilities = summary.accounts.filter(a => ["Credit cards", "Loans", "Mortgages"].includes(a.account_type));

  return (
    <div className="bg-[#18181b] rounded-xl border border-white/10 p-6 flex flex-col h-full shadow-2xl">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-400">🏦</span> Accounts Overview
          </h2>
          <p className="text-sm text-slate-400">Track all your balances in one place</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Net Worth</p>
          <p className={`text-3xl font-black mt-1 ${summary.total_net_worth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${summary.total_net_worth.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto mb-6 space-y-6">
        {/* Assets Section */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 border-b border-white/5 pb-2">Assets</h3>
          {assets.length === 0 ? (
            <p className="text-slate-600 text-sm">No assets added.</p>
          ) : (
            <div className="space-y-2">
              {assets.map(a => (
                <div key={a.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.account_type}</p>
                  </div>
                  <p className="font-mono text-sm font-medium text-green-400">${a.balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Liabilities Section */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 border-b border-white/5 pb-2">Liabilities</h3>
          {liabilities.length === 0 ? (
            <p className="text-slate-600 text-sm">No liabilities added.</p>
          ) : (
            <div className="space-y-2">
              {liabilities.map(a => (
                <div key={a.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.account_type}</p>
                  </div>
                  <p className="font-mono text-sm font-medium text-red-400">-${Math.abs(a.balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleAddAccount} className="mt-auto space-y-3 pt-4 border-t border-white/10">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Add Account</p>
        <div className="flex gap-2">
          <input 
            type="text" placeholder="Account Name (e.g. Chase)" required value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <input 
            type="number" placeholder="Balance" required step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)}
            className="w-28 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={accountType} onChange={(e) => setAccountType(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 appearance-none"
          >
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button 
            type="submit" disabled={loading}
            className="w-28 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
