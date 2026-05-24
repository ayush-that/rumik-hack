import { GoogleGenAI } from "@google/genai";
import { isAuthenticated } from "@/lib/auth-server";

export const runtime = "nodejs";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatCounsellor = {
  slug?: string;
  name?: string;
  specialties?: string[];
  languages?: string[];
  experienceYears?: number;
};

type ChatProfile = {
  name?: string;
  dob?: string;
  birthPlace?: string;
  birthTime?: string;
};

type ChatRequest = {
  messages?: ChatMessage[];
  counsellor?: ChatCounsellor;
  profile?: ChatProfile;
};

function buildSystemPrompt(counsellor?: ChatCounsellor, profile?: ChatProfile) {
  const name = counsellor?.name?.trim() || "Tara";
  const specialties = counsellor?.specialties?.filter(Boolean).join(", ") || "astrology counselling";
  const languages = counsellor?.languages?.filter(Boolean).join(", ") || "English and Hinglish";
  const exp = counsellor?.experienceYears ?? 5;
  const profileDetails = profile?.name && profile?.dob && profile?.birthPlace
    ? `The client has already shared these details: Name: ${profile.name}; DOB: ${profile.dob}; Birth place: ${profile.birthPlace}${profile.birthTime ? `; Birth time: ${profile.birthTime}` : ""}. Do not ask for these again unless the client wants a more precise reading.`
    : "If birth details are missing, ask for name, date of birth, and birth place before giving a detailed reading.";

  return [
    `You are ${name}, an Indian astrology counsellor with ${exp} years of experience.`,
    `You specialise in ${specialties} and speak ${languages}.`,
    profileDetails,
    "You are chatting with a client who wants personal guidance.",
    "Keep replies warm, grounded, and conversational. Reply like a short WhatsApp voice note: 1-2 short spoken sentences by default.",
    "Ask one focused clarifying question when you need context or the exact worry.",
    "Do not use markdown, bullet lists, emojis, or stage directions.",
    "Do not include TTS tags like [happy] or <laugh> in the reply.",
    "For health, legal, finance, or safety topics, be supportive but do not present yourself as a doctor, lawyer, or financial advisor. Encourage professional help for serious or urgent decisions.",
  ].join(" ");
}

function validMessages(messages: ChatMessage[] | undefined) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => (
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0
    ))
    .slice(-12)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content.trim().slice(0, 2000) }],
    }));
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing GOOGLE_API_KEY or GEMINI_API_KEY" },
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const contents = validMessages(body.messages);
  if (contents.length === 0) {
    return Response.json({ error: "At least one message is required" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GOOGLE_CHAT_MODEL || "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: buildSystemPrompt(body.counsellor, body.profile),
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 360,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return Response.json({ error: "The model returned an empty response" }, { status: 502 });
    }

    return Response.json({ text });
  } catch (error) {
    console.error("AI chat failed", error);
    return Response.json(
      { error: "Unable to generate a reply right now" },
      { status: 502 },
    );
  }
}
