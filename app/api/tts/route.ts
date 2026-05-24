import { isAuthenticated } from "@/lib/auth-server";

export const runtime = "nodejs";

const TONES = ["happy", "excited", "sad", "angry", "neutral", "whisper"] as const;
type Tone = (typeof TONES)[number];

type TtsRequest = {
  text?: string;
  tone?: Tone;
  model?: "muga" | "mulberry";
  description?: string;
  speaker?: "speaker_1" | "speaker_2" | "speaker_3" | "speaker_4";
  f0_up_key?: number;
};

function compactRumikError(status: number, detail: string) {
  try {
    const parsed = JSON.parse(detail) as { error?: string; code?: string };
    const message = parsed.error || detail;
    const code = parsed.code ? ` ${parsed.code}` : "";
    return `${status}${code}: ${message}`;
  } catch {
    return `${status}: ${detail}`;
  }
}

function cleanText(text: string) {
  return text
    .replace(/^\[(happy|excited|sad|angry|neutral|whisper)\]\s*/i, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

function normalizeTone(tone: unknown): Tone {
  return TONES.includes(tone as Tone) ? (tone as Tone) : "happy";
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SILK_API_KEY || process.env.RUMIK_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing SILK_API_KEY or RUMIK_API_KEY" },
      { status: 500 },
    );
  }

  let body: TtsRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = cleanText(body.text ?? "");
  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  const model = body.model === "mulberry" ? "mulberry" : "muga";
  const payload: Record<string, unknown> = {
    model,
    text: model === "muga" ? `[${normalizeTone(body.tone)}] ${text}` : text,
    temperature: 0.7,
  };

  if (model === "mulberry") {
    payload.description = body.description || "warm, reassuring Indian counsellor";
    if (body.speaker) payload.speaker = body.speaker;
    if (typeof body.f0_up_key === "number") {
      payload.f0_up_key = Math.max(-12, Math.min(12, body.f0_up_key));
    }
  }

  try {
    const baseUrl = process.env.SILK_BASE_URL || "https://silk-api.rumik.ai";
    const upstream = await fetch(`${baseUrl}/v1/tts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      const compactDetail = compactRumikError(upstream.status, detail.slice(0, 300));
      console.error("Rumik TTS upstream failed", {
        status: upstream.status,
        detail: compactDetail,
        model,
      });
      return Response.json(
        { error: "Rumik TTS failed", detail: compactDetail },
        { status: upstream.status },
      );
    }

    const audio = await upstream.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Rumik TTS failed", error);
    return Response.json({ error: "Unable to synthesize speech right now" }, { status: 502 });
  }
}
