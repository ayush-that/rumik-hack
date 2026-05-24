// LLM brain: OpenRouter → Cerebras → Llama-3.1-8B-Instruct.
// Takes the full conversation history every turn so the bot remembers context.

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
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const counsellor: Counsellor | null = body.counsellor ?? null;
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct";
    const providers = (process.env.OPENROUTER_PROVIDER || "Cerebras")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const fullMessages: ChatMessage[] = [
        { role: "system", content: buildSystemPrompt(counsellor) },
        ...messages.filter((m) => m.role !== "system"),
    ];

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            provider: { order: providers, allow_fallbacks: false },
            messages: fullMessages,
            max_tokens: 256,
            temperature: 0.7,
        }),
    });

    if (!r.ok) {
        const text = await r.text();
        return NextResponse.json({ error: `LLM upstream ${r.status}: ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await r.json();
    const reply: string = data?.choices?.[0]?.message?.content ?? "";
    if (!reply.trim()) {
        return NextResponse.json({ error: "Empty LLM reply", raw: data }, { status: 502 });
    }
    return NextResponse.json({ reply, provider: data?.provider, model: data?.model });
}
