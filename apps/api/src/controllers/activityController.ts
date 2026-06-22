import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { emissionFactorService } from "../services/emissions/emissionFactorService";

const prisma = new PrismaClient();

/** POST /api/v1/activities — manual log entry */
export async function createActivity(req: Request, res: Response) {
  try {
    const userId = req.user!.id; // set by auth middleware
    const { category, subcategory, quantity, unit, occurredAt, region } = req.body;

    if (!category || !subcategory || quantity == null) {
      return res.status(400).json({ error: "category, subcategory, and quantity are required" });
    }

    const { co2eKg, factorUsed } = await emissionFactorService.computeEmissions(
      category,
      subcategory,
      Number(quantity),
      region ?? "GLOBAL"
    );

    const activity = await prisma.activity.create({
      data: {
        userId,
        category,
        subcategory,
        source: "manual",
        quantity: Number(quantity),
        unit: unit ?? factorUsed.unit,
        co2eKg,
        rawInput: { factorUsed: factorUsed as any },
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
    });

    return res.status(201).json(activity);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

/** GET /api/v1/activities — list with optional filters */
export async function listActivities(req: Request, res: Response) {
  const userId = req.user!.id;
  const { category, from, to } = req.query;

  const activities = await prisma.activity.findMany({
    where: {
      userId,
      ...(category ? { category: String(category) } : {}),
      ...(from || to
        ? {
            occurredAt: {
              ...(from ? { gte: new Date(String(from)) } : {}),
              ...(to ? { lte: new Date(String(to)) } : {}),
            },
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
  });

  return res.json(activities);
}

/**
 * POST /api/v1/activities/receipt-scan
 * Expects { ocrText: string } — the raw text already extracted by Tesseract.js
 * on the client, or by Google Vision. This endpoint structures it via LLM.
 * (LLM structuring logic lives in services/ai/receiptParser.ts.)
 */
export async function receiptScan(req: Request, res: Response) {
  const userId = req.user!.id;
  const { ocrText, region } = req.body;

  if (!ocrText) {
    return res.status(400).json({ error: "ocrText is required" });
  }

  const { parseReceiptText } = await import("../services/ai/receiptParser");
  const lineItems = await parseReceiptText(ocrText);

  const created = [];
  for (const item of lineItems) {
    try {
      const { co2eKg, factorUsed } = await emissionFactorService.computeEmissions(
        item.category,
        item.subcategory,
        item.quantity,
        region ?? "GLOBAL"
      );
      const activity = await prisma.activity.create({
        data: {
          userId,
          category: item.category,
          subcategory: item.subcategory,
          source: "receipt_ocr",
          quantity: item.quantity,
          unit: factorUsed.unit,
          co2eKg,
          rawInput: {
  ocrLine: item.rawLine,
  factorUsed: factorUsed as any,
},
          occurredAt: new Date(),
        },
      });
      created.push(activity);
    } catch {
      // Skip line items we can't map to a known emission factor
      continue;
    }
  }

  const totalCo2e = created.reduce((sum, a) => sum + a.co2eKg, 0);
  return res.status(201).json({ activities: created, totalCo2eKg: Math.round(totalCo2e * 1000) / 1000 });
}
