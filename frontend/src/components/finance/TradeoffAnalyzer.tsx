import { useState } from "react";
import { FinancialSummary } from "@/types";

interface Props {
  summary: FinancialSummary | undefined;
}

export function TradeoffAnalyzer({ summary }: Props) {
  const [cost, setCost] = useState("");
  const [item, setItem] = useState("");

  const numCost = parseFloat(cost) || 0;
  
  // Calculate delay in weeks
  const weeklySafe = summary?.weekly_safe_to_spend || 0;
  let delayWeeks = 0;
  if (numCost > 0 && weeklySafe > 0) {
    delayWeeks = numCost / weeklySafe;
  }

  return (
    <div className="bg-[#18181b] rounded-xl border border-white/10 p-6 shadow-2xl">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <span className="text-orange-400">⚡</span> Trade-off Analyzer
      </h2>
      <p className="text-sm text-slate-400 mb-6">See how an impulse buy affects your wishlists.</p>

      <div className="flex gap-2 mb-6">
        <input 
          type="text" placeholder="What do you want to buy?" value={item} onChange={(e) => setItem(e.target.value)}
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
        />
        <input 
          type="number" placeholder="Cost ($)" value={cost} onChange={(e) => setCost(e.target.value)} min="1" step="0.01"
          className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
        />
      </div>

      <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-4 text-center">
        {numCost === 0 ? (
          <p className="text-sm text-slate-400">Type an amount above to see the impact.</p>
        ) : (
          <div>
            <p className="text-sm text-slate-300 mb-2">If you buy the <span className="font-bold text-white">{item || "item"}</span> for <span className="font-mono text-white">${numCost}</span>:</p>
            <p className="text-lg">
              Your wishlist goals will be delayed by <span className="font-black text-orange-400 text-2xl">{delayWeeks.toFixed(1)} weeks</span>.
            </p>
            <p className="text-xs text-slate-500 mt-3">Is it worth it?</p>
          </div>
        )}
      </div>
    </div>
  );
}
