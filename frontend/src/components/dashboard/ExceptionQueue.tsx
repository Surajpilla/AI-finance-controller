import { Settlement } from "@/types";

interface Props {
  settlements: Settlement[] | undefined;
  onSelect: (setl: Settlement) => void;
}

export function ExceptionQueue({ settlements, onSelect }: Props) {
  if (!settlements) {
    return <div className="flex-1 bg-[#18181b] rounded-xl border border-white/10 h-[500px] animate-pulse" />;
  }

  return (
    <div className="flex-1 bg-[#18181b] rounded-xl border border-white/10 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#27272a]/30">
        <h2 className="font-semibold text-lg">Exception Queue</h2>
        <div className="text-sm bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full">
          {settlements.length} Unmatched Settlements
        </div>
      </div>
      
      <div className="overflow-auto flex-1 h-[500px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-black/20 sticky top-0">
            <tr>
              <th className="px-6 py-3">Settlement ID</th>
              <th className="px-6 py-3">Net Expected</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No pending exceptions. All settled!
                </td>
              </tr>
            )}
            {settlements.map((setl) => (
              <tr key={setl.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-xs">{setl.id}</td>
                <td className="px-6 py-4 font-medium">₹{setl.net_amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-slate-400">{new Date(setl.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onSelect(setl)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Investigate &rarr;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
