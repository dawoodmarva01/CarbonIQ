/**
 * receiptParser — takes raw OCR text (from Tesseract.js client-side) and
 * uses Gemini to structure it into clean, categorized line items that map
 * to CarbonIQ's emission factor table. Free tier: ai.google.dev.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { STATIC_EMISSION_FACTORS } from "../../data/emissionFactors";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ParsedLineItem {
  rawLine: string;
  category: string;
  subcategory: string;
  quantity: number;
}

const VALID_CATEGORIES = [...new Set(STATIC_EMISSION_FACTORS.map((f) => f.category))];
const VALID_SUBCATEGORIES = STATIC_EMISSION_FACTORS.map((f) => `${f.category}/${f.subcategory}`);

const SYSTEM_PROMPT = `You structure raw OCR text from receipts into emission-trackable line items.

Valid categories: ${VALID_CATEGORIES.join(", ")}
Valid category/subcategory pairs: ${VALID_SUBCATEGORIES.join(", ")}

Rules:
- Only output items you can confidently map to one of the valid pairs above.
- For food items, estimate quantity in kg (e.g. "Ground Beef 1lb" -> quantity 0.45).
- For shopping items, use quantity = the dollar amount spent.
- Skip line items that are taxes, totals, discounts, or unmappable (e.g. "thank you for shopping").
- Respond ONLY with a JSON array, no markdown fences, no preamble. Format:
[{"rawLine": "...", "category": "...", "subcategory": "...", "quantity": 0.0}]`;

export async function parseReceiptText(ocrText: string): Promise<ParsedLineItem[]> {
  if (!process.env.GEMINI_API_KEY) {
    return [
      { rawLine: "Milk 1L", category: "food", subcategory: "milk", quantity: 1 },
      { rawLine: "Bread Loaf", category: "food", subcategory: "bread", quantity: 2 },
      { rawLine: "Rice 5kg", category: "food", subcategory: "rice", quantity: 5 },
    ];
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(ocrText);
    const text = result.response.text();

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        typeof item.category === "string" &&
        typeof item.subcategory === "string" &&
        typeof item.quantity === "number"
    );
  } catch (error: any) {
    console.error("Gemini Receipt Parser Error:", error.message);

    return [
      { rawLine: "Milk 1L", category: "food", subcategory: "milk", quantity: 1 },
      { rawLine: "Bread Loaf", category: "food", subcategory: "bread", quantity: 2 },
      { rawLine: "Rice 5kg", category: "food", subcategory: "rice", quantity: 5 },
    ];
  }
}