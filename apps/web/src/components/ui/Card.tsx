import { ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("bg-panel border border-line rounded-2xl shadow-card p-6", className)}>
      {children}
    </div>
  );
}

export function StatFigure({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className="animate-countUp">
      <p className="text-[12px] font-medium text-sage uppercase tracking-wide mb-1">{label}</p>
      <p className="font-mono num-mono text-[28px] font-medium" style={{ color: accent || "#10221A" }}>
        {value}
        {unit && <span className="text-[15px] text-sage ml-1.5">{unit}</span>}
      </p>
    </div>
  );
}
