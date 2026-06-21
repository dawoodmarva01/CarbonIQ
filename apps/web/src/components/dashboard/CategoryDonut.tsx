import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../lib/types";

export function CategoryDonut({ breakdown }: { breakdown: Record<string, number> }) {
  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category] ?? category,
      value: Math.round(value * 10) / 10,
      color: CATEGORY_COLORS[category] ?? "#5C6B62",
    }));

  if (data.length === 0) {
    return <p className="text-[13px] text-sage py-12 text-center">No activity logged yet this month.</p>;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-[160px] h-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={48} outerRadius={75} paddingAngle={2} stroke="none">
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} kg CO₂e`, ""]}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E4E7E2", borderRadius: 8, fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-cream">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="num-mono text-sage">{d.value} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
