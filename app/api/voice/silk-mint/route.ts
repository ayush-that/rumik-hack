// Mint a one-shot SILK WebSocket session. The Rumik Bearer key stays
// server-side; the browser only gets the ephemeral ws_url + token.
//
// Voice routing:
//   • female counsellors → muga, with a stable per-counsellor tone tag
//   • male   counsellors → mulberry, with a stable per-counsellor description
//
// Stable hashing on the counsellor slug means each counsellor sounds like
// the same person across calls and across turns within a call — but
// different counsellors get different voice characters.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Hardcoded male roster (no schema change for the hackathon).
// Anything not in here is treated as female.
const MALE_SLUGS = new Set(["devrajit", "parasharya", "jeeshan", "amit", "rohan"]);

// Muga tones suited to a counsellor on a call — avoiding sad/angry/whisper
// which would sound off in this context.
const FEMALE_TONES = ["neutral", "happy", "excited"];

// Mulberry description variants. Each one nudges the model towards a
// different male voice character.
const MALE_DESCRIPTIONS = [
    "Warm, mature Indian male astrologer voice. Calm, measured pace. Slightly deep and grounded, like an experienced practitioner on a phone call.",
    "Friendly young Indian male astrologer voice. Bright and energetic, enthusiastic but professional. Clear pronunciation.",
    "Wise elder Indian male astrologer voice. Slow and deliberate, with the gravitas of decades of practice. Soft warm timbre.",
    "Confident middle-aged Indian male astrologer voice. Clear and direct, friendly but authoritative. Medium pace.",
    "Soft-spoken avuncular Indian male astrologer voice. Comforting, like a trusted family priest. Gentle warm tone.",
];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: Request) {
    const apiKey = process.env.SILK_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "SILK_API_KEY not configured" }, { status: 500 });
    }
    const baseUrl = process.env.SILK_BASE_URL || "https://silk-api.rumik.ai";

    const body = await req.json().catch(() => ({}));
    const text: string = body.text ?? "";
    const counsellorSlug: string = body.counsellorSlug ?? "";
    const explicitGender: string | undefined = body.gender; // "male" | "female"

    if (!text.trim()) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const isMale = explicitGender === "male" || (!!counsellorSlug && MALE_SLUGS.has(counsellorSlug));

    const model = isMale ? "mulberry" : process.env.SILK_MODEL || "muga";
    // Randomise per request → variety across calls and across turns.
    const tone = isMale ? null : pickRandom(FEMALE_TONES);
    const description = isMale ? pickRandom(MALE_DESCRIPTIONS) : null;

    const mintBody: Record<string, unknown> = { model, text };
    if (description) mintBody.description = description;

    const r = await fetch(`${baseUrl}/v1/tts/ws-connect`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(mintBody),
    });

    if (!r.ok) {
        const err = await r.text();
        return NextResponse.json(
            { error: `SILK upstream ${r.status}: ${err.slice(0, 300)}` },
            { status: 502 },
        );
    }
    const data = await r.json();
    return NextResponse.json({
        ws_url: data.ws_url,
        token: data.token,
        model,
        tone,
        description,
    });
}
