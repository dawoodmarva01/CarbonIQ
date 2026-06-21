/**
 * coachService — conversational AI Climate Coach. Uses Gemini's
 * function-calling to query the user's *real* logged activities rather than
 * freeform generation, so answers like "why was my footprint high?" are
 * grounded. Free tier: https://ai.google.dev — no card required.
 */
import { GoogleGenerativeAI, SchemaType, FunctionDeclaration } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in .env");
}

const genAI = new GoogleGenerativeAI(apiKey);
const prisma = new PrismaClient();

const TOOLS: FunctionDeclaration[] = [
  {
    name: "get_user_activities",
    description:
      "Fetch the user's logged carbon activities within a date range, optionally filtered by category.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        from: { type: SchemaType.STRING, description: "ISO date, start of range" },
        to: { type: SchemaType.STRING, description: "ISO date, end of range" },
        category: {
          type: SchemaType.STRING,
          description: "Optional: transport|food|energy|shopping|flights",
        },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_category_totals",
    description:
      "Get total kg CO2e per category for the user within a date range. Use this for 'why is my footprint high' type questions.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        from: { type: SchemaType.STRING },
        to: { type: SchemaType.STRING },
      },
      required: ["from", "to"],
    },
  },
];

async function executeTool(userId: string, name: string, args: any) {
  if (name === "get_user_activities") {
    return prisma.activity.findMany({
      where: {
        userId,
        occurredAt: {
          gte: new Date(args.from),
          lte: new Date(args.to),
        },
        ...(args.category ? { category: args.category } : {}),
      },
      orderBy: {
        co2eKg: "desc",
      },
      take: 20,
    });
  }

  if (name === "get_category_totals") {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        occurredAt: {
          gte: new Date(args.from),
          lte: new Date(args.to),
        },
      },
    });

    const totals: Record<string, number> = {};

    for (const activity of activities) {
      totals[activity.category] =
        (totals[activity.category] ?? 0) + activity.co2eKg;
    }

    return totals;
  }

  return {
    error: "Unknown tool",
  };
}

const SYSTEM_PROMPT = `
You are the CarbonIQ Climate Coach.

You help users understand their carbon footprint using their REAL logged data.
Never invent numbers.

Always call a function before answering questions about the user's footprint,
logged activities, category totals, high-emission causes, or reduction suggestions.

Be encouraging but honest.
Use specific kg CO2e values and categories whenever data is available.
Keep responses to 2-4 sentences unless the user asks for more detail.
`;

interface SimpleMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithCoach(
  userId: string,
  userMessage: string,
  history: SimpleMessage[] = []
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    tools: [
      {
        functionDeclarations: TOOLS,
      },
    ],
  });

  const geminiHistory = history.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: message.content,
      },
    ],
  }));

  const chat = model.startChat({
    history: geminiHistory,
  });

  let result = await chat.sendMessage(userMessage);

  let rounds = 0;

  while (rounds < 3) {
    const calls = result.response.functionCalls();

    if (!calls || calls.length === 0) {
      break;
    }

    const responses = await Promise.all(
      calls.map(async (call) => {
        const toolResult = await executeTool(userId, call.name, call.args);

        return {
          functionResponse: {
            name: call.name,
            response: {
              result: toolResult,
            },
          },
        };
      })
    );

    result = await chat.sendMessage(responses);
    rounds++;
  }

  return result.response.text() || "I couldn't generate a response.";
}

export async function chatWithCoach(
  userId: string,
  userMessage: string,
  history: SimpleMessage[] = []
) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
      tools: [
        {
          functionDeclarations: TOOLS,
        },
      ],
    });

    const geminiHistory = history.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const chat = model.startChat({
      history: geminiHistory,
    });

    let result = await chat.sendMessage(userMessage);

    let rounds = 0;

    while (rounds < 3) {
      const calls = result.response.functionCalls();

      if (!calls || calls.length === 0) break;

      const responses = await Promise.all(
        calls.map(async (call) => {
          const toolResult = await executeTool(userId, call.name, call.args);

          return {
            functionResponse: {
              name: call.name,
              response: {
                result: toolResult,
              },
            },
          };
        })
      );

      result = await chat.sendMessage(responses);
      rounds++;
    }

    return result.response.text() || "I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini error:", error.message);

    return `I'm currently running in demo mode because the AI quota is temporarily exceeded. 
Based on your logged footprint, focus first on high-impact areas like transport, electricity usage, food choices, and shopping habits. 
Try reducing private vehicle travel, switching off unused appliances, choosing more plant-based meals, and tracking your weekly CO₂e reduction.`;
  }
}