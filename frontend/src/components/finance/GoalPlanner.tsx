import { useState } from "react";
import { mutate } from "swr";
import { FinancialSummary } from "@/types";

interface Props {
  summary: FinancialSummary | undefined;
  apiUrl: string;
}

export function GoalPlanner({ summary, apiUrl }: Props) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!summary) return <div className="h-64 bg-[#18181b] animate-pulse rounded-xl" />;

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${apiUrl}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, target_amount: parseFloat(targetAmount) }),
      });
      setName("");
      setTargetAmount("");
      mutate(`${apiUrl}/summary`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#18181b] rounded-xl border border-white/10 p-6 flex flex-col h-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">Wishlist & Goals</h2>
          <p className="text-sm text-slate-400">Items you are currently funding</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Safe to Spend / Week</p>
          <p className="text-3xl font-black text-green-400 mt-1">
            ${summary.weekly_safe_to_spend.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-auto mb-6">
        {summary.goals.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No goals yet. Add something you want!</p>
        ) : (
          summary.goals.map(g => {
            const progress = g.target_amount > 0 ? (g.current_saved / g.target_amount) * 100 : 0;
            return (
              <div key={g.id} className="bg-black/30 p-4 rounded-lg border border-white/5">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{g.name}</span>
                  <span className="font-mono text-sm">${g.current_saved.toFixed(0)} / ${g.target_amount.toFixed(0)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddGoal} className="flex gap-2 mt-auto">
        <input 
          type="text" 
          placeholder="What do you want?" 
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <input 
          type="number" 
          placeholder="Price ($)" 
          required
          min="1"
          step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
