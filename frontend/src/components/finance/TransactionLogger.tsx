import { useState } from "react";
import { mutate } from "swr";
import { FinancialSummary } from "@/types";

interface Props {
  summary: FinancialSummary | undefined;
  apiUrl: string;
}

const PURPOSES = [
  "Groceries / Survival",
  "Productivity / Investment",
  "Socializing",
  "Guilty Pleasure",
  "Impulse Buy",
  "Gift for someone"
];

export function TransactionLogger({ summary, apiUrl }: Props) {
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category] = useState("Shopping");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [loading, setLoading] = useState(false);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${apiUrl}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), merchant, category, purpose }),
      });
      setAmount("");
      setMerchant("");
      mutate(`${apiUrl}/summary`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#18181b] rounded-xl border border-white/10 p-6">
      <h2 className="text-xl font-bold mb-1">The &quot;Why&quot; Logger</h2>
      <p className="text-sm text-slate-400 mb-6">Log a transaction and assign an intent.</p>

      <form onSubmit={handleLog} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Amount ($)</label>
            <input 
              type="number" required min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-lg font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Merchant</label>
            <input 
              type="text" required placeholder="e.g. Amazon" value={merchant} onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">What was the purpose?</label>
          <div className="grid grid-cols-2 gap-2">
            {PURPOSES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${purpose === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/10'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !amount || !merchant}
          className="w-full mt-4 bg-white hover:bg-slate-200 disabled:bg-slate-600 disabled:text-slate-400 text-black py-3 rounded-lg font-bold transition-colors"
        >
          {loading ? "Logging..." : "Log & Update Plan"}
        </button>
      </form>

      {summary && summary.recent_transactions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Recent Logs</h3>
          <div className="space-y-2">
            {summary.recent_transactions.slice(0, 3).map(tx => (
              <div key={tx.id} className="bg-black/30 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{tx.merchant}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <span className="bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{tx.purpose}</span>
                  </p>
                </div>
                <p className="font-mono text-sm font-medium">${tx.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
