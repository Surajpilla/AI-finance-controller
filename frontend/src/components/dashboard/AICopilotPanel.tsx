import { Settlement, BankTransaction } from "@/types";

interface Props {
  selectedException: Settlement;
  unmatchedBankTxs: BankTransaction[];
  onClose: () => void;
}

export function AICopilotPanel({ selectedException, unmatchedBankTxs, onClose }: Props) {
  return (
    <div className="w-[450px] bg-[#18181b] rounded-xl border border-blue-500/30 flex flex-col shadow-2xl shadow-blue-900/20">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-blue-900/20">
        <h2 className="font-semibold text-blue-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5h2v2H9V5zm0 4h2v6H9V9z" />
          </svg>
          AI Copilot Analysis
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
      </div>
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div>
          <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Target Settlement</h3>
          <div className="bg-black/30 p-4 rounded-lg font-mono text-sm space-y-1">
            <p><span className="text-slate-500">ID:</span> {selectedException.id}</p>
            <p><span className="text-slate-500">Net:</span> ₹{selectedException.net_amount.toFixed(2)}</p>
            <p><span className="text-slate-500">UTR:</span> {selectedException.utr}</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">AI Suggestion</h3>
          <div className="bg-blue-950/30 border border-blue-800/50 p-4 rounded-lg text-sm text-blue-200">
            <p>The ReconCore AI could not find an exact or fuzzy match. It appears the bank deposit was split or delayed. Please manually review the Unmatched Bank Transactions below.</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase text-slate-500 font-bold mb-2">Unmatched Bank Txns</h3>
          <div className="space-y-2">
            {unmatchedBankTxs.map((btx) => (
              <div key={btx.id} className="bg-black/30 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                <div>
                  <p className="font-mono text-xs text-slate-400">{btx.description}</p>
                  <p className="text-xs text-slate-500">{new Date(btx.date).toLocaleDateString()}</p>
                </div>
                <p className="font-medium text-sm">₹{btx.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex gap-2">
          <button className="flex-1 bg-white text-black py-2 rounded-md font-medium hover:bg-slate-200 transition-colors">
            Force Match Selected
          </button>
          <button className="flex-1 border border-white/20 py-2 rounded-md font-medium hover:bg-white/10 transition-colors">
            Mark as Missing
          </button>
        </div>
      </div>
    </div>
  );
}
