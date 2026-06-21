import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";

interface Scenario {
  key: string;
  label: string;
  category: string;
}

const SCENARIO_MAX: Record<string, { max: number; format: (v: number) => string }> = {
  vegetarian_days: { max: 7, format: (v) => `${Math.round(v * 7)} days/week` },
  ev_switch: { max: 1, format: (v) => (v >= 0.99 ? "Switched" : "Not switched") },
  renewable_energy: { max: 1, format: (v) => `${Math.round(v * 100)}% solar` },
  fewer_flights: { max: 1, format: (v) => `${Math.round(v * 100)}% fewer flights` },
};

export function SimulatorPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [intensities, setIntensities] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getScenarios().then(setScenarios).catch(() => {});
  }, []);

  async function runSimulation(updated: Record<string, number>) {
    setLoading(true);
    const changes = Object.entries(updated)
      .filter(([, v]) => v > 0)
      .map(([scenario, intensity]) => ({ scenario, intensity }));
    try {
      const r = await api.simulateWhatIf(changes);
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function updateIntensity(key: string, value: number) {
    const updated = { ...intensities, [key]: value };
    setIntensities(updated);
    runSimulation(updated);
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-[24px] font-semibold text-cream">What if…</h1>
        <p className="text-[14px] text-sage mt-1">Drag a slider, see your projected year change instantly.</p>
      </header>

      <div className="grid grid-cols-[340px_1fr] gap-6">
        <Card className="space-y-6">
          {scenarios.map((s) => {
            const config = SCENARIO_MAX[s.key] ?? { max: 1, format: (v: number) => `${Math.round(v * 100)}%` };
            const value = intensities[s.key] ?? 0;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-cream">{s.label}</span>
                  <span className="num-mono text-[12px] text-lime">{config.format(value)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={config.max}
                  step={config.max / 20}
                  value={value}
                  onChange={(e) => updateIntensity(s.key, parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-line appearance-none cursor-pointer accent-[#1D9E75]"
                />
              </div>
            );
          })}
        </Card>

        <Card>
          {!result && !loading && (
            <div className="h-[380px] flex items-center justify-center">
              <p className="text-[13px] text-sage">Move a slider to see your projection.</p>
            </div>
          )}

          {result && (
            <>
              <div className="flex items-center gap-8 mb-6">
                <div>
                  <p className="text-[11px] text-sage uppercase tracking-wide">Current pace</p>
                  <p className="num-mono text-[22px] font-medium text-cream">{result.baselineMonthlyCo2eKg} kg/mo</p>
                </div>
                <div>
                  <p className="text-[11px] text-sage uppercase tracking-wide">Projected pace</p>
                  <p className="num-mono text-[22px] font-medium text-lime">{result.projectedMonthlyCo2eKg} kg/mo</p>
                </div>
                <div>
                  <p className="text-[11px] text-sage uppercase tracking-wide">Annual savings</p>
                  <p className="num-mono text-[22px] font-medium text-lime">{result.annualSavingsKg} kg</p>
                </div>
              </div>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.projection} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5C6B62" }} tickFormatter={(m) => `M${m}`} axisLine={{ stroke: "#E4E7E2" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5C6B62" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E4E7E2", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="baselineCo2eKg" name="If nothing changes" stroke="#5C6B62" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                    <Line type="monotone" dataKey="projectedCo2eKg" name="With this change" stroke="#1D9E75" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
