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
    return (
        `You are ${counsellor.name}, an Indian astrology counsellor with ${counsellor.experienceYears} years of experience. ` +
        `You specialise in ${specialties}. ` +
        "You are on a live voice call with a client who has come for guidance on a personal matter. " +
        "Speak warmly and unhurriedly, like an experienced practitioner. " +
        "Keep replies short (1-3 sentences) — this is a voice conversation, not an essay. " +
        "Avoid emojis, lists, or any formatting that doesn't speak naturally. " +
        "If the client asks for a reading, ask about the specific worry first before launching in. " +
        "Greet the client by introducing yourself by name." +
        clientSection +
        `\n\n${LANGUAGE_RULES}`
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

    // STREAM Gemini's SSE response → emit only text deltas as a plain byte
    // stream the browser can read incrementally and feed to TTS sentence by
    // sentence. Big perceived-latency win: bot starts speaking sentence 1
    // before Gemini has finished generating sentences 2/3.
    const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": apiKey,
            },
            body: JSON.stringify(reqBody),
        },
    );

    if (!upstream.ok || !upstream.body) {
        const text = upstream.body ? await upstream.text() : "no body";
        return NextResponse.json(
            { error: `Gemini upstream ${upstream.status}: ${text.slice(0, 300)}` },
            { status: 502 },
        );
    }

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const reader = upstream.body!.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buf = "";
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });
                    // SSE events end with \n\n
                    let nl;
                    while ((nl = buf.indexOf("\n\n")) >= 0) {
                        const event = buf.slice(0, nl);
                        buf = buf.slice(nl + 2);
                        for (const line of event.split("\n")) {
                            if (!line.startsWith("data: ")) continue;
                            const json = line.slice(6).trim();
                            if (!json || json === "[DONE]") continue;
                            try {
                                const data = JSON.parse(json);
                                const text: string =
                                    data?.candidates?.[0]?.content?.parts
                                        ?.map((p: { text?: string }) => p.text ?? "")
                                        .join("") ?? "";
                                if (text) controller.enqueue(encoder.encode(text));
                            } catch {
                                // malformed chunk, ignore
                            }
                        }
                    }
                }
            } catch (e) {
                controller.error(e);
                return;
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
        },
    });
}
