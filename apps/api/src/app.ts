import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import { authMiddleware } from "./middleware/auth";
import { createActivity, listActivities, receiptScan } from "./controllers/activityController";
import { simulateWhatIf, AVAILABLE_SCENARIOS } from "./services/forecast/simulatorService";
import { forecastNextMonth, detectAnomaly } from "./services/forecast/forecastService";
import { chatWithCoach } from "./services/ai/coachService";
import { signup, login } from "./controllers/authController";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health ──
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Auth ──
app.post("/api/v1/auth/signup", signup);
app.post("/api/v1/auth/login", login);

// ── Activities ──
app.post("/api/v1/activities", authMiddleware, createActivity);
app.get("/api/v1/activities", authMiddleware, listActivities);
app.post("/api/v1/activities/receipt-scan", authMiddleware, receiptScan);

// ── Dashboard ──
app.get("/api/v1/dashboard/summary", authMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activities = await prisma.activity.findMany({
    where: { userId, occurredAt: { gte: thirtyDaysAgo } },
  });
  const totalCo2eKg = activities.reduce((s, a) => s + a.co2eKg, 0);
  const byCategory: Record<string, number> = {};
  for (const a of activities) byCategory[a.category] = (byCategory[a.category] ?? 0) + a.co2eKg;

  const anomaly = await detectAnomaly(userId);

  res.json({
    totalCo2eKg: Math.round(totalCo2eKg * 1000) / 1000,
    categoryBreakdown: byCategory,
    activityCount: activities.length,
    anomaly,
  });
});

app.get("/api/v1/dashboard/forecast", authMiddleware, async (req, res) => {
  const forecast = await forecastNextMonth(req.user!.id);
  res.json(forecast);
});

// ── What-if Simulator ──
app.get("/api/v1/simulator/scenarios", (_req, res) => res.json(AVAILABLE_SCENARIOS));
app.post("/api/v1/simulator/what-if", authMiddleware, async (req, res) => {
  try {
    const result = await simulateWhatIf(req.user!.id, req.body.changes ?? []);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── AI Coach ──
app.post("/api/v1/coach/chat", authMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const recentHistory = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const history = recentHistory.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const reply = await chatWithCoach(userId, message, history);

  await prisma.chatMessage.createMany({
    data: [
      { userId, role: "user", content: message },
      { userId, role: "assistant", content: reply },
    ],
  });

  res.json({ reply });
});

app.get("/api/v1/coach/history", authMiddleware, async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

// ── Leaderboard (seeded/mocked for MVP) ──
app.get("/api/v1/leaderboard", async (req, res) => {
  const scope = req.query.scope ?? "global";
  const users = await prisma.user.findMany({ take: 10, include: { activities: true } });
  const ranked = users
    .map((u) => ({
      name: u.name,
      totalCo2eKg: Math.round(u.activities.reduce((s, a) => s + a.co2eKg, 0) * 1000) / 1000,
    }))
    .sort((a, b) => a.totalCo2eKg - b.totalCo2eKg); // lower footprint = better rank
  res.json({ scope, leaderboard: ranked });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CarbonIQ API running on port ${PORT}`));

export default app;
