import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CATEGORY_LABELS } from "../lib/types";

const SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string; unit: string }[]> = {
  transport: [
    { value: "car_petrol", label: "Petrol car", unit: "km" },
    { value: "car_diesel", label: "Diesel car", unit: "km" },
    { value: "car_ev", label: "Electric car", unit: "km" },
    { value: "motorbike", label: "Motorbike", unit: "km" },
    { value: "bus", label: "Bus", unit: "km" },
    { value: "train", label: "Train", unit: "km" },
    { value: "flight_domestic", label: "Domestic flight", unit: "km" },
    { value: "flight_international", label: "International flight", unit: "km" },
    { value: "bicycle", label: "Bicycle", unit: "km" },
    { value: "rideshare", label: "Rideshare", unit: "km" },
  ],
  food: [
    { value: "beef", label: "Beef", unit: "kg" },
    { value: "chicken", label: "Chicken", unit: "kg" },
    { value: "pork", label: "Pork", unit: "kg" },
    { value: "fish", label: "Fish", unit: "kg" },
    { value: "dairy", label: "Dairy", unit: "kg" },
    { value: "eggs", label: "Eggs", unit: "kg" },
    { value: "rice", label: "Rice", unit: "kg" },
    { value: "vegetables", label: "Vegetables", unit: "kg" },
    { value: "restaurant_meal", label: "Restaurant meal", unit: "meal" },
  ],
  energy: [
    { value: "electricity", label: "Electricity", unit: "kWh" },
    { value: "natural_gas", label: "Natural gas", unit: "kWh" },
    { value: "lpg_cylinder", label: "LPG cylinder", unit: "cylinder" },
  ],
  shopping: [
    { value: "clothing", label: "Clothing", unit: "usd" },
    { value: "electronics", label: "Electronics", unit: "usd" },
    { value: "furniture", label: "Furniture", unit: "usd" },
    { value: "online_misc", label: "Online / misc", unit: "usd" },
  ],
  waste: [
    { value: "landfill", label: "Landfill", unit: "kg" },
    { value: "recycled", label: "Recycled", unit: "kg" },
    { value: "composted", label: "Composted", unit: "kg" },
  ],
};

export function LogActivityPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("transport");
  const [subcategory, setSubcategory] = useState(SUBCATEGORY_OPTIONS.transport[0].value);
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ co2eKg: number } | null>(null);
  const [error, setError] = useState("");

  const options = SUBCATEGORY_OPTIONS[category];
  const selectedUnit = options.find((o) => o.value === subcategory)?.unit ?? "";

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);
    setSubcategory(SUBCATEGORY_OPTIONS[newCategory][0].value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError("Enter a quantity greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      const activity = await api.createActivity({ category, subcategory, quantity: qty, unit: selectedUnit });
      setSuccess({ co2eKg: activity.co2eKg });
      setQuantity("");
    } catch (err: any) {
      setError(err.message || "Couldn't log that activity.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-[24px] font-semibold text-cream">Log an activity</h1>
        <p className="text-[14px] text-sage mt-1">No receipt, no bank sync — just type it in. Takes ten seconds.</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[13px] font-medium text-cream mb-2 block">Category</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(SUBCATEGORY_OPTIONS).map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                      category === cat
                        ? "bg-lime/10 border-lime text-lime"
                        : "bg-panel2 border-line text-sage hover:text-cream"
                    }`}
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-[13px] font-medium text-cream mb-1.5 block">What was it?</span>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-void text-[14px] text-cream focus:outline-none focus:border-lime transition-colors"
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[13px] font-medium text-cream mb-1.5 block">
                Quantity <span className="text-sage">({selectedUnit})</span>
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`e.g. ${selectedUnit === "km" ? "20" : selectedUnit === "kg" ? "0.5" : "1"}`}
                className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-void text-[14px] text-cream placeholder:text-sage/60 focus:outline-none focus:border-lime transition-colors"
                required
              />
            </label>

            {error && <p className="text-[13px] text-coral">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full justify-center">
              {submitting ? "Logging…" : "Log activity"}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col">
          {!success && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] text-sage text-center max-w-[220px]">
                Fill in the form — your emission factor and kg CO₂e will appear here instantly.
              </p>
            </div>
          )}

          {success && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <CheckCircle2 size={28} className="text-lime" />
              <div>
                <p className="text-[13px] text-sage">Logged successfully</p>
                <p className="num-mono text-[28px] font-medium text-lime mt-1">{success.co2eKg} kg CO₂e</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" onClick={() => setSuccess(null)}>Log another</Button>
                <Button onClick={() => navigate("/")}>View dashboard</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
