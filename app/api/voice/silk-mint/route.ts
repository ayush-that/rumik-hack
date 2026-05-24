// Mint a one-shot SILK WebSocket session. The Rumik Bearer key stays
// server-side; the browser only gets the ephemeral ws_url + token.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const apiKey = process.env.SILK_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "SILK_API_KEY not configured" }, { status: 500 });
    }
    const baseUrl = process.env.SILK_BASE_URL || "https://silk-api.rumik.ai";
    const model = process.env.SILK_MODEL || "muga";

    const body = await req.json().catch(() => ({}));
    const text: string = body.text ?? "";
    if (!text.trim()) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const r = await fetch(`${baseUrl}/v1/tts/ws-connect`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, text }),
    });

    if (!r.ok) {
        const err = await r.text();
        return NextResponse.json({ error: `SILK upstream ${r.status}: ${err.slice(0, 300)}` }, { status: 502 });
    }
    const data = await r.json();
    return NextResponse.json({
        ws_url: data.ws_url,
        token: data.token,
        model,
        tone: process.env.SILK_TONE || "neutral",
    });
}
