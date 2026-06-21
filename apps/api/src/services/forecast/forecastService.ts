/**
 * forecastService — lightweight linear-regression forecast on the user's
 * monthly CO2e totals. Pure JS, zero dependencies, ships in the MVP window.
 * Swap for Prophet/statsmodels in a Python microservice later if you want
 * confidence intervals beyond the simple residual-based band used here.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MonthlyPoint {
  monthIndex: number; // 0, 1, 2... chronological
  period: string;      // "2026-04"
  totalCo2eKg: number;
}

function linearRegression(points: MonthlyPoint[]): { slope: number; intercept: number; residualStd: number } {
  const n = points.length;
  const xs = points.map((p) => p.monthIndex);
  const ys = points.map((p) => p.totalCo2eKg);

  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const residualStd = Math.sqrt(residuals.reduce((a, r) => a + r ** 2, 0) / Math.max(n - 1, 1));

  return { slope, intercept, residualStd };
}

export async function forecastNextMonth(userId: string) {
  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { occurredAt: "asc" },
  });

  if (activities.length === 0) {
    return { error: "Not enough data — log at least one month of activities first." };
  }

  // Bucket into calendar months
  const byMonth = new Map<string, number>();
  for (const a of activities) {
    const key = `${a.occurredAt.getFullYear()}-${String(a.occurredAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + a.co2eKg);
  }

  const sortedMonths = [...byMonth.keys()].sort();
  const points: MonthlyPoint[] = sortedMonths.map((period, i) => ({
    monthIndex: i,
    period,
    totalCo2eKg: byMonth.get(period)!,
  }));

  // With only 1-2 months of data, fall back to a flat projection (regression on 1 point is meaningless)
  if (points.length < 3) {
    const last = points[points.length - 1].totalCo2eKg;
    return {
      predictedCo2e: Math.round(last * 1000) / 1000,
      confidenceLow: Math.round(last * 0.85 * 1000) / 1000,
      confidenceHigh: Math.round(last * 1.15 * 1000) / 1000,
      method: "flat_projection",
      note: "Forecast accuracy improves after 3+ months of logged data.",
      history: points,
    };
  }

  const { slope, intercept, residualStd } = linearRegression(points);
  const nextIndex = points.length;
  const predicted = slope * nextIndex + intercept;

  return {
    predictedCo2e: Math.round(Math.max(0, predicted) * 1000) / 1000,
    confidenceLow: Math.round(Math.max(0, predicted - 1.28 * residualStd) * 1000) / 1000, // ~80% band
    confidenceHigh: Math.round((predicted + 1.28 * residualStd) * 1000) / 1000,
    method: "linear_regression",
    trendDirection: slope > 5 ? "rising" : slope < -5 ? "falling" : "stable",
    history: points,
  };
}

/** Simple anomaly flag: current month is >2x the trailing 3-month average. */
export async function detectAnomaly(userId: string) {
  const activities = await prisma.activity.findMany({ where: { userId }, orderBy: { occurredAt: "desc" } });
  if (activities.length === 0) return null;

  const now = new Date();
  const currentMonthTotal = activities
    .filter((a) => a.occurredAt.getMonth() === now.getMonth() && a.occurredAt.getFullYear() === now.getFullYear())
    .reduce((s, a) => s + a.co2eKg, 0);

  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const trailing = activities.filter((a) => a.occurredAt >= threeMonthsAgo && a.occurredAt < now);
  const trailingAvg = trailing.length ? trailing.reduce((s, a) => s + a.co2eKg, 0) / 3 : 0;

  if (trailingAvg > 0 && currentMonthTotal > trailingAvg * 2) {
    // Identify the biggest contributing category this month
    const thisMonth = activities.filter(
      (a) => a.occurredAt.getMonth() === now.getMonth() && a.occurredAt.getFullYear() === now.getFullYear()
    );
    const byCategory: Record<string, number> = {};
    for (const a of thisMonth) byCategory[a.category] = (byCategory[a.category] ?? 0) + a.co2eKg;
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    return {
      isAnomaly: true,
      currentMonthKg: Math.round(currentMonthTotal * 1000) / 1000,
      trailingAvgKg: Math.round(trailingAvg * 1000) / 1000,
      multiplier: Math.round((currentMonthTotal / trailingAvg) * 10) / 10,
      topContributor: topCategory ? { category: topCategory[0], kg: Math.round(topCategory[1] * 1000) / 1000 } : null,
    };
  }

  return { isAnomaly: false };
}
