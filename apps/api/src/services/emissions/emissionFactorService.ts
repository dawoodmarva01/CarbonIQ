/**
 * emissionFactorService — single source of truth for "how many kg CO2e is
 * this activity worth". Currently backed by the static table; swap
 * `getFactor()`'s body to call Climatiq/Carbon Interface live, cache the
 * result in Redis, and fall back to the static table on API failure.
 * Nothing else in the codebase needs to change.
 */
import { STATIC_EMISSION_FACTORS, EmissionFactorRow } from "../../data/emissionFactors";

const FALLBACK_REGION = "GLOBAL";

export class EmissionFactorService {
  private table: EmissionFactorRow[];

  constructor() {
    this.table = STATIC_EMISSION_FACTORS;
  }

  /**
   * Returns kg CO2e per unit for a given category/subcategory/region.
   * Falls back to GLOBAL region if a region-specific factor doesn't exist.
   */
  async getFactor(
    category: string,
    subcategory: string,
    region: string = FALLBACK_REGION
  ): Promise<EmissionFactorRow> {
    const regional = this.table.find(
      (r) => r.category === category && r.subcategory === subcategory && r.region === region
    );
    if (regional) return regional;

    const global = this.table.find(
      (r) => r.category === category && r.subcategory === subcategory && r.region === FALLBACK_REGION
    );
    if (global) return global;

    throw new Error(`No emission factor for ${category}/${subcategory} (region ${region})`);
  }

  /** Compute kg CO2e for a logged quantity. */
  async computeEmissions(
    category: string,
    subcategory: string,
    quantity: number,
    region: string = FALLBACK_REGION
  ): Promise<{ co2eKg: number; factorUsed: EmissionFactorRow }> {
    const factor = await this.getFactor(category, subcategory, region);
    return {
      co2eKg: Math.round(quantity * factor.factorValue * 1000) / 1000,
      factorUsed: factor,
    };
  }

  /** List all known subcategories for a category — used by the frontend logging form. */
  listSubcategories(category: string): string[] {
    return [...new Set(
      this.table.filter((r) => r.category === category).map((r) => r.subcategory)
    )];
  }
}

export const emissionFactorService = new EmissionFactorService();
