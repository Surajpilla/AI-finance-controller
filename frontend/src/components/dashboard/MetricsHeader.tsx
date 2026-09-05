import { Metrics } from "@/types";

interface Props {
  metrics: Metrics | undefined;
}

export function MetricsHeader({ metrics }: Props) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#18181b] p-6 rounded-xl border border-white/10 h-[100px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-[#18181b] p-6 rounded-xl border border-white/10">
        <h3 className="text-sm font-medium text-slate-400">Total Settlements</h3>
        <p className="text-3xl font-bold mt-2">{metrics.total_settlements}</p>
      </div>
      <div className="bg-[#18181b] p-6 rounded-xl border border-white/10">
        <h3 className="text-sm font-medium text-slate-400">Match Rate</h3>
        <p className="text-3xl font-bold mt-2 text-green-400">{metrics.match_rate}%</p>
      </div>
      <div className="bg-[#18181b] p-6 rounded-xl border border-white/10">
        <h3 className="text-sm font-medium text-slate-400">Throughput</h3>
        <p className="text-3xl font-bold mt-2">{metrics.throughput}</p>
      </div>
      <div className="bg-[#18181b] p-6 rounded-xl border border-white/10">
        <h3 className="text-sm font-medium text-slate-400">Pending Exceptions</h3>
        <p className="text-3xl font-bold mt-2 text-orange-400">{metrics.pending_exceptions}</p>
      </div>
    </div>
  );
}
