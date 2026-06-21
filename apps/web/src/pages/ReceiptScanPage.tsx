import { useRef, useState } from "react";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CATEGORY_LABELS } from "../lib/types";

type Stage = "idle" | "ocr" | "structuring" | "done" | "error";

export function ReceiptScanPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ activities: any[]; totalCo2eKg: number } | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setStage("ocr");

    try {
      // Tesseract.js — client-side OCR, loaded dynamically to keep initial bundle small
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(file, "eng");
      const ocrText = data.text;

      setStage("structuring");
      const scanResult = await api.receiptScan(ocrText);
      setResult(scanResult);
      setStage("done");
    } catch (err: any) {
      setError(err.message || "Couldn't process that receipt. Try a clearer photo.");
      setStage("error");
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-[24px] font-semibold text-cream">Scan a receipt</h1>
        <p className="text-[14px] text-sage mt-1">No typing — AI reads it and maps every item to a real emission factor.</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {!preview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[3/4] border-2 border-dashed border-line rounded-xl flex flex-col items-center justify-center gap-3 hover:border-lime hover:bg-lime/5 transition-colors"
            >
              <Camera size={32} className="text-sage" />
              <span className="text-[14px] font-medium text-cream">Take or upload a photo</span>
              <span className="text-[12px] text-sage">Grocery receipt, fuel receipt, or utility bill</span>
            </button>
          ) : (
            <div className="space-y-3">
              <img src={preview} alt="Receipt preview" className="w-full rounded-xl border border-line max-h-[400px] object-contain bg-panel2" />
              <Button variant="secondary" onClick={() => { setPreview(null); setStage("idle"); setResult(null); }} className="w-full justify-center">
                Scan another
              </Button>
            </div>
          )}
        </Card>

        <Card>
          {stage === "idle" && (
            <div className="h-full flex items-center justify-center py-16">
              <p className="text-[13px] text-sage text-center">Results will appear here once you scan a receipt.</p>
            </div>
          )}

          {(stage === "ocr" || stage === "structuring") && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-lime animate-spin" />
              <p className="text-[14px] text-cream font-medium">
                {stage === "ocr" ? "Reading text from image…" : "Mapping items to emission factors…"}
              </p>
            </div>
          )}

          {stage === "error" && (
            <div className="py-12 text-center">
              <p className="text-[14px] text-coral">{error}</p>
            </div>
          )}

          {stage === "done" && result && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-lime" />
                <h2 className="font-display text-[15px] font-semibold text-cream">
                  {result.activities.length} item{result.activities.length !== 1 ? "s" : ""} logged
                </h2>
              </div>

              <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto scrollbar-thin">
                {result.activities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-line text-[13px]">
                    <div>
                      <span className="text-cream font-medium">{a.subcategory.replace(/_/g, " ")}</span>
                      <span className="text-sage ml-2">{CATEGORY_LABELS[a.category]}</span>
                    </div>
                    <span className="num-mono text-sage">{a.co2eKg} kg</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line">
                <span className="text-[13px] font-medium text-cream">Total impact</span>
                <span className="num-mono text-[20px] font-medium text-lime">{result.totalCo2eKg} kg CO₂e</span>
              </div>

              {result.activities.length === 0 && (
                <p className="text-[13px] text-sage mt-3">
                  No items could be confidently matched. Try a clearer photo, or log manually instead.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
