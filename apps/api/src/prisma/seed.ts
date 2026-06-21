/**
 * seed.ts — generates a realistic synthetic dataset for demo/judging:
 * 8 demo users with 4 months of varied activity history each, so the
 * dashboard, forecast, leaderboard, and what-if simulator all have
 * real numbers to show on stage with zero manual data entry.
 *
 * Run: npx ts-node src/prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STATIC_EMISSION_FACTORS } from "../data/emissionFactors";

const prisma = new PrismaClient();

const DEMO_USERS = [
  { name: "Asha Rao", email: "asha@demo.carboniq.app", region: "IN", profile: "low" },
  { name: "Marcus Chen", email: "marcus@demo.carboniq.app", region: "GLOBAL", profile: "high" },
  { name: "Priya Nair", email: "priya@demo.carboniq.app", region: "IN", profile: "medium" },
  { name: "Liam O'Connor", email: "liam@demo.carboniq.app", region: "GLOBAL", profile: "medium" },
  { name: "Fatima Al-Sayed", email: "fatima@demo.carboniq.app", region: "GLOBAL", profile: "low" },
  { name: "Diego Torres", email: "diego@demo.carboniq.app", region: "GLOBAL", profile: "high" },
  { name: "You (Demo Account)", email: "demo@carboniq.app", region: "IN", profile: "medium" },
  { name: "Sara Kim", email: "sara@demo.carboniq.app", region: "GLOBAL", profile: "low" },
];

// Profile = how many activities/week and which categories dominate
const PROFILE_CONFIG: Record<string, { transportKmPerWeek: number; meatMealsPerWeek: number; flightsPerQuarter: number; electricityKwhPerWeek: number }> = {
  low:    { transportKmPerWeek: 30,  meatMealsPerWeek: 1, flightsPerQuarter: 0, electricityKwhPerWeek: 35 },
  medium: { transportKmPerWeek: 90,  meatMealsPerWeek: 4, flightsPerQuarter: 1, electricityKwhPerWeek: 55 },
  high:   { transportKmPerWeek: 220, meatMealsPerWeek: 9, flightsPerQuarter: 2, electricityKwhPerWeek: 90 },
};

function factorFor(category: string, subcategory: string, region: string) {
  return (
    STATIC_EMISSION_FACTORS.find((f) => f.category === category && f.subcategory === subcategory && f.region === region) ??
    STATIC_EMISSION_FACTORS.find((f) => f.category === category && f.subcategory === subcategory && f.region === "GLOBAL")!
  );
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function main() {
  console.log("Clearing existing demo data…");
  await prisma.chatMessage.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: "@demo.carboniq.app" } } });
  await prisma.user.deleteMany({ where: { email: "demo@carboniq.app" } });

  const passwordHash = await bcrypt.hash("demo1234", 10);

  for (const demoUser of DEMO_USERS) {
    const user = await prisma.user.create({
      data: {
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        region: demoUser.region,
      },
    });

    const config = PROFILE_CONFIG[demoUser.profile];
    const activities: any[] = [];

    // Generate 4 months of history, week by week
    for (let weekOffset = 16; weekOffset >= 0; weekOffset--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekOffset * 7);

      // Transport: split across a few trips per week
      const tripsThisWeek = 3 + Math.floor(randomBetween(0, 3));
      const kmPerTrip = config.transportKmPerWeek / tripsThisWeek;
      const transportModes = ["car_petrol", "bus", "train", "rideshare"];
      for (let t = 0; t < tripsThisWeek; t++) {
        const mode = transportModes[Math.floor(Math.random() * transportModes.length)];
        const factor = factorFor("transport", mode, user.region);
        const km = kmPerTrip * randomBetween(0.6, 1.4);
        const date = new Date(weekStart);
        date.setDate(date.getDate() + Math.floor(Math.random() * 7));
        activities.push({
          userId: user.id, category: "transport", subcategory: mode, source: "manual",
          quantity: Math.round(km * 10) / 10, unit: "km",
          co2eKg: Math.round(km * factor.factorValue * 1000) / 1000,
          occurredAt: date, rawInput: { seeded: true },
        });
      }

      // Food: meat meals + veg meals
      const meatTypes = ["beef", "chicken", "pork", "fish"];
      for (let m = 0; m < config.meatMealsPerWeek; m++) {
        const type = meatTypes[Math.floor(Math.random() * meatTypes.length)];
        const factor = factorFor("food", type, "GLOBAL");
        const kg = randomBetween(0.15, 0.35);
        const date = new Date(weekStart);
        date.setDate(date.getDate() + Math.floor(Math.random() * 7));
        activities.push({
          userId: user.id, category: "food", subcategory: type, source: "manual",
          quantity: Math.round(kg * 100) / 100, unit: "kg",
          co2eKg: Math.round(kg * factor.factorValue * 1000) / 1000,
          occurredAt: date, rawInput: { seeded: true },
        });
      }
      const vegMeals = 7 - config.meatMealsPerWeek;
      if (vegMeals > 0) {
        const factor = factorFor("food", "vegetables", "GLOBAL");
        const kg = vegMeals * randomBetween(0.2, 0.3);
        activities.push({
          userId: user.id, category: "food", subcategory: "vegetables", source: "manual",
          quantity: Math.round(kg * 100) / 100, unit: "kg",
          co2eKg: Math.round(kg * factor.factorValue * 1000) / 1000,
          occurredAt: weekStart, rawInput: { seeded: true },
        });
      }

      // Energy: weekly electricity
      const elecFactor = factorFor("energy", "electricity", user.region);
      const kwh = config.electricityKwhPerWeek * randomBetween(0.85, 1.15);
      activities.push({
        userId: user.id, category: "energy", subcategory: "electricity", source: "manual",
        quantity: Math.round(kwh * 10) / 10, unit: "kWh",
        co2eKg: Math.round(kwh * elecFactor.factorValue * 1000) / 1000,
        occurredAt: weekStart, rawInput: { seeded: true },
      });

      // Occasional shopping (40% of weeks)
      if (Math.random() < 0.4) {
        const shopTypes = ["clothing", "electronics", "online_misc"];
        const type = shopTypes[Math.floor(Math.random() * shopTypes.length)];
        const factor = factorFor("shopping", type, "GLOBAL");
        const amount = randomBetween(15, 120);
        const date = new Date(weekStart);
        date.setDate(date.getDate() + Math.floor(Math.random() * 7));
        activities.push({
          userId: user.id, category: "shopping", subcategory: type, source: "bank_sync",
          quantity: Math.round(amount * 100) / 100, unit: "usd",
          co2eKg: Math.round(amount * factor.factorValue * 1000) / 1000,
          occurredAt: date, rawInput: { seeded: true, mcc: "synthetic" },
        });
      }
    }

    // Flights: spread across the 4 months per profile rate
    const flightFactor = factorFor("transport", "flight_domestic", "GLOBAL");
    const totalFlights = Math.round((config.flightsPerQuarter / 13) * 16); // ~16 weeks of history
    for (let i = 0; i < totalFlights; i++) {
      const distance = randomBetween(400, 1800);
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 112));
      activities.push({
        userId: user.id, category: "transport", subcategory: "flight_domestic", source: "manual",
        quantity: Math.round(distance), unit: "km",
        co2eKg: Math.round(distance * flightFactor.factorValue * 1000) / 1000,
        occurredAt: date, rawInput: { seeded: true },
      });
    }

    // Inject one deliberate anomaly month for the demo account (for the anomaly-detection feature)
    if (demoUser.email === "demo@carboniq.app") {
      const longHaul = factorFor("transport", "flight_international", "GLOBAL");
      const distance = 6500;
      activities.push({
        userId: user.id, category: "transport", subcategory: "flight_international", source: "manual",
        quantity: distance, unit: "km",
        co2eKg: Math.round(distance * longHaul.factorValue * 1000) / 1000,
        occurredAt: new Date(), rawInput: { seeded: true, note: "anomaly demo trigger" },
      });
    }

    await prisma.activity.createMany({ data: activities });
    console.log(`Seeded ${activities.length} activities for ${user.name} (${user.email})`);
  }

  console.log("\nDone. All demo accounts use password: demo1234");
  console.log("Primary demo login: demo@carboniq.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
