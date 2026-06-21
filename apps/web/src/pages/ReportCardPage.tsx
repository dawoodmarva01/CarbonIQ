import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CATEGORY_LABELS } from "../lib/types";

export function ReportCardPage() {
  const [summary, setSummary] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    api.getDashboardSummary().then(setSummary).catch(() => {});
  }, []);

  useEffect(() => {
    if (!summary || !canvasRef.current) return;
    drawCard(canvasRef.current, summary);
  }, [summary]);

  function drawCard(canvas: HTMLCanvasElement, data: any) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 600, H = 750;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#E4E7E2";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Header
    ctx.fillStyle = "#1D9E75";
    ctx.beginPath();
    ctx.arc(50, 56, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10221A";
    ctx.font = "600 22px 'Space Grotesk', sans-serif";
    ctx.fillText("CarbonIQ", 70, 64);

    ctx.font = "500 14px 'Inter', sans-serif";
    ctx.fillStyle = "#5C6B62";
    ctx.fillText("Weekly Climate Report", 50, 100);

    // Big number
    ctx.font = "600 64px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#1D9E75";
    ctx.fillText(`${data.totalCo2eKg}`, 50, 190);
    ctx.font = "500 18px 'Inter', sans-serif";
    ctx.fillStyle = "#5C6B62";
    ctx.fillText("kg CO₂e this month", 50, 215);

    // Equivalent
    const equivalentKm = Math.round((data.totalCo2eKg / 0.192) * 10) / 10;
    ctx.font = "400 14px 'Inter', sans-serif";
    ctx.fillStyle = "#5C6B62";
    wrapText(ctx, `≈ driving ${equivalentKm} km in a petrol car`, 50, 250);

    // Divider
    ctx.strokeStyle = "#E4E7E2";
    ctx.beginPath();
    ctx.moveTo(50, 290);
    ctx.lineTo(W - 50, 290);
    ctx.stroke();

    // Category breakdown bars
    ctx.font = "600 14px 'Inter', sans-serif";
    ctx.fillStyle = "#10221A";
    ctx.fillText("Breakdown", 50, 320);

    const categories = Object.entries(data.categoryBreakdown || {}) as [string, number][];
    const maxVal = Math.max(...categories.map(([, v]) => v), 1);
    const colors: Record<string, string> = {
      transport: "#1D9E75", food: "#E0563F", energy: "#3C6FB7", shopping: "#B7913C", flights: "#8A5CB7",
    };

    let y = 345;
    for (const [cat, val] of categories) {
      ctx.font = "500 12px 'Inter', sans-serif";
      ctx.fillStyle = "#10221A";
      ctx.fillText(CATEGORY_LABELS[cat] ?? cat, 50, y);

      ctx.fillStyle = "#F3F5F1";
      ctx.fillRect(160, y - 10, 320, 12);
      ctx.fillStyle = colors[cat] ?? "#5C6B62";
      ctx.fillRect(160, y - 10, (val / maxVal) * 320, 12);

      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#5C6B62";
      ctx.fillText(`${Math.round(val * 10) / 10}kg`, 490, y);

      y += 32;
    }

    // Footer
    ctx.font = "400 12px 'Inter', sans-serif";
    ctx.fillStyle = "#5C6B62";
    ctx.fillText(`Generated ${new Date().toLocaleDateString()} · carboniq.app`, 50, H - 30);
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    ctx.fillText(text, x, y);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "carboniq-report-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "carboniq-report.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My CarbonIQ Report Card" });
      } else {
        handleDownload();
      }
    });
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-[24px] font-semibold text-cream">Report card</h1>
        <p className="text-[14px] text-sage mt-1">Auto-generated, shareable — your built-in growth loop.</p>
      </header>

      <div className="grid grid-cols-[auto_1fr] gap-8 items-start">
        <Card className="p-0 overflow-hidden">
          <canvas ref={canvasRef} className="block" style={{ width: 300, height: 375 }} />
        </Card>

        <div className="pt-2">
          <p className="text-[14px] text-sage mb-4 max-w-[320px]">
            Every week, CarbonIQ generates a fresh card from your real numbers — built to share on social media as a growth loop.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleDownload}>
              <span className="flex items-center gap-2"><Download size={15} /> Download</span>
            </Button>
            <Button variant="secondary" onClick={handleShare}>
              <span className="flex items-center gap-2"><Share2 size={15} /> Share</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
