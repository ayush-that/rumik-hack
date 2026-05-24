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
    tagline?: string | null;
    signature?: string | null;
    hometown?: string | null;
    region?: string | null;
    personaPrompt?: string | null;
};

type UserProfile = {
    displayName?: string | null;
    gender?: "male" | "female" | null;
    birthDate?: string | null; // YYYY-MM-DD
    birthTime?: string | null; // HH:MM
    birthTimeUnknown?: boolean;
    birthPlace?: string | null;
};

function computeAge(birthDate?: string | null): number | null {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
    return age >= 0 ? age : null;
}

function pickSalutation(age: number | null, gender?: "male" | "female" | null): string {
    if (age === null) return "beta";
    if (age < 25) return "beta";
    if (age < 40) return gender === "female" ? "behen" : "bhai";
    if (age < 60) return gender === "female" ? "ji" : "ji";
    return gender === "female" ? "auntyji" : "uncleji";
}

const LANGUAGE_RULES =
    "LANGUAGE — STRICT: Reply in Hinglish (Hindi written in Roman/Latin script, naturally mixed " +
    "with English words). Do NOT use Devanagari (देवनागरी) — write Hindi words phonetically. " +
    "Examples of the right style: 'Namaste beta, kaisi hain aap aaj?', " +
    "'Aap ki marriage ke baare mein guidance chahiye? Pehle apna janma tithi bataiye.', " +
    "'Dekhiye, aapki kundali mein Saturn strong position mein hai, isliye thoda patience rakhna padega.'. " +
    "Keep it warm, casual, conversational — like a real elder counsellor on a phone call.";

function buildClientBlock(profile: UserProfile | null): string {
    if (!profile) return "";
    const age = computeAge(profile.birthDate);
    const salutation = pickSalutation(age, profile.gender);
    const lines: string[] = ["CLIENT DETAILS (use these naturally in conversation, do not list them back):"];
    if (profile.displayName) lines.push(`- Name: ${profile.displayName}`);
    if (profile.gender) lines.push(`- Gender: ${profile.gender}`);
    if (profile.birthDate) lines.push(`- Date of birth: ${profile.birthDate}${age !== null ? ` (age ${age})` : ""}`);
    if (profile.birthTimeUnknown) {
        lines.push("- Time of birth: unknown (the client doesn't remember; work without it)");
    } else if (profile.birthTime) {
        lines.push(`- Time of birth: ${profile.birthTime}`);
    }
    if (profile.birthPlace) lines.push(`- Place of birth: ${profile.birthPlace}`);
    lines.push(
        `SALUTATION: Address the client as "${salutation}" (age-appropriate). ` +
            "Do NOT ask for their name, date/time/place of birth — you already have them. " +
            "Use the first name when you greet them.",
    );
    return lines.join("\n");
}

function buildSystemPrompt(counsellor: Counsellor | null, profile: UserProfile | null): string {
    const clientBlock = buildClientBlock(profile);
    const clientSection = clientBlock ? `\n\n${clientBlock}` : "";

    if (!counsellor) {
        return (
            "You are a warm, friendly Indian astrology counsellor speaking on a voice call. " +
            "Keep replies short (1-3 sentences). Avoid emojis, lists, or formatting. " +
            "Ask one clarifying question at a time." +
            clientSection +
            `\n\n${LANGUAGE_RULES}`
        );
    }
    const specialties = counsellor.specialties.join(", ") || "astrology";
    const bgBits: string[] = [];
    if (counsellor.hometown) bgBits.push(`from ${counsellor.hometown}`);
    if (counsellor.region) bgBits.push(`(${counsellor.region})`);
    const backgroundLine = bgBits.length ? ` You are ${bgBits.join(" ")}.` : "";
    const taglineLine = counsellor.tagline ? ` Your public tagline: "${counsellor.tagline}".` : "";
    const signatureLine = counsellor.signature
        ? ` SIGNATURE PHRASE — you slip this in once per conversation when it fits naturally: "${counsellor.signature}". Do NOT force it; only use it when it lands.`
        : "";
    const personaBlock = counsellor.personaPrompt
        ? `\n\nPERSONA — this is the voice you MUST speak in:\n${counsellor.personaPrompt}`
        : "";

    return (
        `You are ${counsellor.name}, an Indian astrology counsellor with ${counsellor.experienceYears} years of experience. ` +
        `You specialise in ${specialties}.` +
        backgroundLine +
        taglineLine +
        " You are on a live voice call with a client who has come for guidance on a personal matter. " +
        "Speak warmly and unhurriedly, like an experienced practitioner. " +
        "Keep replies short (1-3 sentences) — this is a voice conversation, not an essay. " +
        "Avoid emojis, lists, or any formatting that doesn't speak naturally. " +
        "If the client asks for a reading, ask about the specific worry first before launching in. " +
        "Greet the client by introducing yourself by name." +
        signatureLine +
        personaBlock +
        clientSection +
        `\n\n${LANGUAGE_RULES}`
    );
}

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }
    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

    const body = await req.json().catch(() => ({}));
    const counsellor: Counsellor | null = body.counsellor ?? null;
    const profile: UserProfile | null = body.profile ?? null;
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
        systemInstruction: { parts: [{ text: buildSystemPrompt(counsellor, profile) }] },
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
        return NextResponse.json(
            { error: `Gemini upstream ${r.status}: ${text.slice(0, 300)}` },
            { status: 502 },
        );
    }

    const data = await r.json();
    const reply: string =
        data?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text || "")
            .join("") || "";

    if (!reply.trim()) {
        return NextResponse.json({ error: "Empty Gemini reply", raw: data }, { status: 502 });
    }
    return NextResponse.json({ reply, model });
}
