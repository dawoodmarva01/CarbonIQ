import { useEffect, useState } from "react";
import { Medal } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";

type Scope = "global" | "neighborhood" | "org";

export function LeaderboardPage() {
  const [scope, setScope] = useState<Scope>("global");
  const [data, setData] = useState<{ name: string; totalCo2eKg: number }[]>([]);

  useEffect(() => {
    api.getLeaderboard(scope).then((r) => setData(r.leaderboard)).catch(() => setData([]));
  }, [scope]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-[24px] font-semibold text-cream">Leaderboard</h1>
        <p className="text-[14px] text-sage mt-1">Lower footprint ranks higher. Accountability that sticks.</p>
      </header>

      <div className="flex gap-2 mb-5">
        {(["global", "neighborhood", "org"] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium capitalize transition-colors ${
              scope === s ? "bg-lime text-white" : "bg-panel2 text-sage hover:text-cream"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        {data.map((row, i) => (
          <div
            key={row.name}
            className={`flex items-center gap-4 px-5 py-3.5 ${i !== data.length - 1 ? "border-b border-line" : ""}`}
          >
            <span className="w-6 text-center">
              {i < 3 ? (
                <Medal size={18} className={i === 0 ? "text-[#B7913C]" : i === 1 ? "text-sage" : "text-coral/60"} />
              ) : (
                <span className="num-mono text-[13px] text-sage">{i + 1}</span>
              )}
            </span>
            <span className="flex-1 text-[14px] font-medium text-cream">{row.name}</span>
            <span className="num-mono text-[14px] text-sage">{row.totalCo2eKg} kg CO₂e</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-[13px] text-sage text-center py-10">No data yet for this scope.</p>}
      </Card>
    </div>
  );
}
