import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, PenLine, ScanLine, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { Card, StatFigure } from "../components/ui/Card";
import { ClimateTwin } from "../components/dashboard/ClimateTwin";
import { CategoryDonut } from "../components/dashboard/CategoryDonut";
import { ForecastChart } from "../components/dashboard/ForecastChart";
import { DashboardSummary, ForecastResult, CATEGORY_LABELS } from "../lib/types";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardSummary(), api.getForecast()])
      .then(([s, f]) => {
        setSummary(s);
        setForecast(f);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trend: "rising" | "stable" | "falling" | "loading" = loading
    ? "loading"
    : (forecast?.trendDirection as any) ?? "stable";

  const equivalent = summary ? Math.round((summary.totalCo2eKg / 0.192) * 10) / 10 : 0;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-[24px] font-semibold text-cream">Your climate twin</h1>
        <p className="text-[14px] text-sage mt-1">A living model of your footprint, updated as you log.</p>
      </header>

      {!loading && summary?.activityCount === 0 && (
        <Card className="mb-6 border-lime/30 bg-lime/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-cream">Your twin has nothing to learn from yet</p>
              <p className="text-[13px] text-sage mt-0.5">Log your first activity and everything below comes alive.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to="/log">
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium bg-panel2 border border-line text-cream hover:border-lime transition-colors">
                  <PenLine size={14} /> Log manually
                </button>
              </Link>
              <Link to="/scan">
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium bg-lime text-white hover:bg-lime/90 transition-colors">
                  <ScanLine size={14} /> Scan a receipt <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-[280px_1fr] gap-6 mb-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <ClimateTwin trend={trend} />
          <p className="text-[13px] text-sage mt-4 capitalize">
            {loading ? "Reading your data…" : `Trend: ${trend}`}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <StatFigure
              label="This month"
              value={loading ? "—" : `${summary?.totalCo2eKg ?? 0}`}
              unit="kg CO₂e"
              accent="#1D9E75"
            />
            {!loading && summary && (
              <p className="text-[12px] text-sage mt-2">
                ≈ driving <span className="num-mono text-cream">{equivalent} km</span> in a petrol car
              </p>
            )}
          </Card>
          <Card>
            <StatFigure label="Activities logged" value={loading ? "—" : `${summary?.activityCount ?? 0}`} accent="#3C6FB7" />
            <p className="text-[12px] text-sage mt-2">in the last 30 days</p>
          </Card>

          {summary?.anomaly?.isAnomaly && (
            <Card className="col-span-2 border-coral/30 bg-coral/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-coral shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-cream">Footprint spike detected</p>
                  <p className="text-[13px] text-sage mt-0.5">
                    This month is{" "}
                    <span className="num-mono text-coral">{summary.anomaly.multiplier}×</span> your trailing average
                    {summary.anomaly.topContributor && (
                      <>
                        , mostly from{" "}
                        <span className="text-cream font-medium">
                          {CATEGORY_LABELS[summary.anomaly.topContributor.category]}
                        </span>{" "}
                        (<span className="num-mono">{summary.anomaly.topContributor.kg} kg</span>)
                      </>
                    )}
                    .
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-[15px] font-semibold text-cream mb-4">Breakdown by category</h2>
          {summary && <CategoryDonut breakdown={summary.categoryBreakdown} />}
        </Card>
        <Card>
          <h2 className="font-display text-[15px] font-semibold text-cream mb-4">Forecast</h2>
          {forecast && <ForecastChart forecast={forecast} />}
        </Card>
      </div>
    </div>
  );
}
