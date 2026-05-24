// LLM brain: Google Gemini Flash Lite (direct API, NOT via OpenRouter —
// the Cerebras-hosted Llama route was hitting 429s).
// Takes the full conversation history every turn for full context.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type Counsellor = {
    slug: string;
    name: string;
    specialties: string[];
    languages: string[];
    experienceYears: number;
};

const LANGUAGE_RULES =
    "LANGUAGE — STRICT: Reply in Hinglish (Hindi written in Roman/Latin script, naturally mixed " +
    "with English words). Do NOT use Devanagari (देवनागरी) — write Hindi words phonetically. " +
    "Examples of the right style: 'Namaste beta, kaisi hain aap aaj?', " +
    "'Aap ki marriage ke baare mein guidance chahiye? Pehle apna janma tithi bataiye.', " +
    "'Dekhiye, aapki kundali mein Saturn strong position mein hai, isliye thoda patience rakhna padega.'. " +
    "Keep it warm, casual, conversational — like a real elder counsellor on a phone call.";

function buildSystemPrompt(counsellor: Counsellor | null): string {
    if (!counsellor) {
        return (
            "You are a warm, friendly Indian astrology counsellor speaking on a voice call. " +
            "Keep replies short (1-3 sentences). Avoid emojis, lists, or formatting. " +
            "Ask one clarifying question at a time.\n\n" +
            LANGUAGE_RULES
        );
    }
    const specialties = counsellor.specialties.join(", ") || "astrology";
    return (
        `You are ${counsellor.name}, an Indian astrology counsellor with ${counsellor.experienceYears} years of experience. ` +
        `You specialise in ${specialties}. ` +
        "You are on a live voice call with a client who has come for guidance on a personal matter. " +
        "Speak warmly and unhurriedly, like an experienced practitioner. " +
        "Keep replies short (1-3 sentences) — this is a voice conversation, not an essay. " +
        "Avoid emojis, lists, or any formatting that doesn't speak naturally. " +
        "If the client asks for a reading, ask one focused clarifying question first " +
        "(birth time, birth place, the specific worry) before launching in. " +
        "Greet the client by introducing yourself by name.\n\n" +
        LANGUAGE_RULES
    );
}

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }
    const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

    const body = await req.json().catch(() => ({}));
    const counsellor: Counsellor | null = body.counsellor ?? null;
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    // Gemini wants role="user"/"model" (NOT "assistant") and a separate
    // systemInstruction outside the contents array.
    const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

    const reqBody = {
        systemInstruction: { parts: [{ text: buildSystemPrompt(counsellor) }] },
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
        },
    };

    const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": apiKey,
            },
            body: JSON.stringify(reqBody),
        },
    );

    if (!r.ok) {
        const text = await r.text();
        return NextResponse.json({ error: `Gemini upstream ${r.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await r.json();
    const reply: string =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";

    if (!reply.trim()) {
        return NextResponse.json({ error: "Empty Gemini reply", raw: data }, { status: 502 });
    }
    return NextResponse.json({ reply, model });
}
