/**
 * Static emission-factor dataset — used as an offline fallback so CarbonIQ
 * works immediately with zero API keys. Values are kg CO2e per unit, sourced
 * from published figures (UK DEFRA / EPA / IPCC AR6 averages, India-adjusted
 * where noted). Swap to live Climatiq/Carbon Interface data later by
 * implementing the same `EmissionFactorRow` shape in emissionFactorService.ts
 * — no other code changes needed.
 */

export interface EmissionFactorRow {
  category: string;
  subcategory: string;
  region: string;
  factorValue: number; // kg CO2e per unit
  unit: string;
  sourceApi: string;
}

export const STATIC_EMISSION_FACTORS: EmissionFactorRow[] = [
  // ── TRANSPORT (per km) ──
  { category: "transport", subcategory: "car_petrol", region: "GLOBAL", factorValue: 0.192, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "car_diesel", region: "GLOBAL", factorValue: 0.171, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "car_ev", region: "IN", factorValue: 0.079, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "motorbike", region: "GLOBAL", factorValue: 0.103, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "bus", region: "GLOBAL", factorValue: 0.105, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "train", region: "GLOBAL", factorValue: 0.041, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "flight_domestic", region: "GLOBAL", factorValue: 0.255, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "flight_international", region: "GLOBAL", factorValue: 0.150, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "bicycle", region: "GLOBAL", factorValue: 0.0, unit: "km", sourceApi: "static_fallback" },
  { category: "transport", subcategory: "rideshare", region: "GLOBAL", factorValue: 0.176, unit: "km", sourceApi: "static_fallback" },

  // ── ENERGY (per kWh, India grid average vs global) ──
  { category: "energy", subcategory: "electricity", region: "IN", factorValue: 0.708, unit: "kWh", sourceApi: "static_fallback" },
  { category: "energy", subcategory: "electricity", region: "GLOBAL", factorValue: 0.475, unit: "kWh", sourceApi: "static_fallback" },
  { category: "energy", subcategory: "natural_gas", region: "GLOBAL", factorValue: 0.202, unit: "kWh", sourceApi: "static_fallback" },
  { category: "energy", subcategory: "lpg_cylinder", region: "IN", factorValue: 42.4, unit: "cylinder", sourceApi: "static_fallback" },

  // ── FOOD (per kg of food item) ──
  { category: "food", subcategory: "beef", region: "GLOBAL", factorValue: 27.0, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "lamb", region: "GLOBAL", factorValue: 21.4, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "pork", region: "GLOBAL", factorValue: 7.6, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "chicken", region: "GLOBAL", factorValue: 4.6, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "fish", region: "GLOBAL", factorValue: 4.0, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "dairy", region: "GLOBAL", factorValue: 2.5, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "eggs", region: "GLOBAL", factorValue: 2.1, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "rice", region: "GLOBAL", factorValue: 2.7, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "vegetables", region: "GLOBAL", factorValue: 0.4, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "fruit", region: "GLOBAL", factorValue: 0.5, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "grains_bread", region: "GLOBAL", factorValue: 1.1, unit: "kg", sourceApi: "static_fallback" },
  { category: "food", subcategory: "restaurant_meal", region: "GLOBAL", factorValue: 3.5, unit: "meal", sourceApi: "static_fallback" },

  // ── SHOPPING (per $ spent — proxy MCC-based factors) ──
  { category: "shopping", subcategory: "clothing", region: "GLOBAL", factorValue: 0.45, unit: "usd", sourceApi: "static_fallback" },
  { category: "shopping", subcategory: "electronics", region: "GLOBAL", factorValue: 0.32, unit: "usd", sourceApi: "static_fallback" },
  { category: "shopping", subcategory: "furniture", region: "GLOBAL", factorValue: 0.38, unit: "usd", sourceApi: "static_fallback" },
  { category: "shopping", subcategory: "groceries_general", region: "GLOBAL", factorValue: 0.28, unit: "usd", sourceApi: "static_fallback" },
  { category: "shopping", subcategory: "online_misc", region: "GLOBAL", factorValue: 0.30, unit: "usd", sourceApi: "static_fallback" },

  // ── WASTE (per kg) ──
  { category: "waste", subcategory: "landfill", region: "GLOBAL", factorValue: 0.58, unit: "kg", sourceApi: "static_fallback" },
  { category: "waste", subcategory: "recycled", region: "GLOBAL", factorValue: 0.04, unit: "kg", sourceApi: "static_fallback" },
  { category: "waste", subcategory: "composted", region: "GLOBAL", factorValue: 0.01, unit: "kg", sourceApi: "static_fallback" },
];

/** Merchant-category-code → CarbonIQ category/subcategory mapping, for bank-sync auto-tagging. */
export const MCC_MAPPING: Record<string, { category: string; subcategory: string; unit: string }> = {
  "5411": { category: "shopping", subcategory: "groceries_general", unit: "usd" }, // Grocery Stores
  "5812": { category: "food", subcategory: "restaurant_meal", unit: "usd" },       // Restaurants
  "5541": { category: "transport", subcategory: "car_petrol", unit: "usd" },        // Gas Stations
  "4111": { category: "transport", subcategory: "train", unit: "usd" },             // Transit
  "4511": { category: "transport", subcategory: "flight_domestic", unit: "usd" },   // Airlines
  "5651": { category: "shopping", subcategory: "clothing", unit: "usd" },           // Clothing Stores
  "5732": { category: "shopping", subcategory: "electronics", unit: "usd" },        // Electronics
  "4900": { category: "energy", subcategory: "electricity", unit: "usd" },          // Utilities
};
