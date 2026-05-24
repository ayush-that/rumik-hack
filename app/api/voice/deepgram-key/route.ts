// Returns the Deepgram API key for browser WebSocket auth.
// HACKATHON ONLY: this is a shared event key — it's rotated after the
// event. In production, mint short-lived ephemeral keys via Deepgram's
// scoped-key API and never ship the master key client-side.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) {
        return NextResponse.json({ error: "DEEPGRAM_API_KEY not configured" }, { status: 500 });
    }
    return NextResponse.json({ key });
}
