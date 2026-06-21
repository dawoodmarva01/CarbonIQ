export interface Activity {
  id: string;
  category: "transport" | "food" | "energy" | "shopping" | "flights";
  subcategory: string;
  source: "manual" | "receipt_ocr" | "bank_sync" | "voice";
  quantity: number;
  unit: string;
  co2eKg: number;
  occurredAt: string;
}

export interface DashboardSummary {
  totalCo2eKg: number;
  categoryBreakdown: Record<string, number>;
  activityCount: number;
  anomaly: {
    isAnomaly: boolean;
    currentMonthKg?: number;
    trailingAvgKg?: number;
    multiplier?: number;
    topContributor?: { category: string; kg: number } | null;
  } | null;
}

export interface ForecastResult {
  predictedCo2e: number;
  confidenceLow: number;
  confidenceHigh: number;
  method: "linear_regression" | "flat_projection";
  trendDirection?: "rising" | "stable" | "falling";
  note?: string;
  history: { monthIndex: number; period: string; totalCo2eKg: number }[];
  error?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  transport: "#1D9E75",
  food: "#E0563F",
  energy: "#3C6FB7",
  shopping: "#B7913C",
  flights: "#8A5CB7",
};

export const CATEGORY_LABELS: Record<string, string> = {
  transport: "Transport",
  food: "Food",
  energy: "Energy",
  shopping: "Shopping",
  flights: "Flights",
};
