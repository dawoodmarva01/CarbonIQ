import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { ForecastResult } from "../../lib/types";

export function ForecastChart({ forecast }: { forecast: ForecastResult }) {
  if (forecast.error) {
    return <p className="text-[13px] text-sage py-10 text-center">{forecast.error}</p>;
  }

  const data = [
    ...forecast.history.map((h) => ({ label: h.period.slice(5), actual: Math.round(h.totalCo2eKg * 10) / 10, predicted: null as number | null })),
    { label: "Next", actual: null, predicted: forecast.predictedCo2e },
  ];

  return (
    <div>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5C6B62" }} axisLine={{ stroke: "#E4E7E2" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#5C6B62" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E4E7E2", borderRadius: 8, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="actual" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="predicted" stroke="#E0563F" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <div>
          <p className="text-[11px] text-sage uppercase tracking-wide">Predicted next month</p>
          <p className="num-mono text-[20px] font-medium text-cream">{forecast.predictedCo2e} kg</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-sage uppercase tracking-wide">Range</p>
          <p className="num-mono text-[13px] text-sage">{forecast.confidenceLow}–{forecast.confidenceHigh} kg</p>
        </div>
      </div>
      {forecast.note && <p className="text-[12px] text-sage mt-2">{forecast.note}</p>}
    </div>
  );
}
