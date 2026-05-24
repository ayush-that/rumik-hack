// Mint a one-shot SILK WebSocket session. The Rumik Bearer key stays
// server-side; the browser only gets the ephemeral ws_url + token.
//
// Voice routing:
//   • female counsellors → muga (ultra-low-latency, single voice)
//   • male counsellors   → mulberry with a male description (slower, but
//     muga ships one feminine voice only, so men sound wrong on it)

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Hardcoded male roster — keeps the schema simple for the hackathon.
// Anything not in here defaults to female (muga).
const MALE_SLUGS = new Set(["devrajit", "parasharya", "jeeshan", "amit", "rohan"]);

const MALE_DESCRIPTION =
    "Warm, mature Indian male astrologer voice. Calm, measured pace. Slightly deep " +
    "and grounded, like an experienced practitioner on a phone call.";

export async function POST(req: Request) {
    const apiKey = process.env.SILK_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "SILK_API_KEY not configured" }, { status: 500 });
    }
    const baseUrl = process.env.SILK_BASE_URL || "https://silk-api.rumik.ai";

    const body = await req.json().catch(() => ({}));
    const text: string = body.text ?? "";
    const counsellorSlug: string | undefined = body.counsellorSlug;
    const explicitGender: string | undefined = body.gender; // "male" | "female"

    if (!text.trim()) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const isMale =
        explicitGender === "male" || (counsellorSlug !== undefined && MALE_SLUGS.has(counsellorSlug));

    const model = isMale ? "mulberry" : process.env.SILK_MODEL || "muga";
    const tone = process.env.SILK_TONE || "neutral";

    const mintBody: Record<string, unknown> = { model, text };
    if (isMale) {
        // Mulberry steers off the description when no `speaker` preset is set.
        mintBody.description = MALE_DESCRIPTION;
    }

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
        // Muga uses [tone] tags; mulberry steers off description and ignores tones.
        tone: model === "muga" ? tone : null,
        description: isMale ? MALE_DESCRIPTION : null,
    });
}
