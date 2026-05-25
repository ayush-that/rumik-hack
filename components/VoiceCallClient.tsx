"use client";

// Direct-to-provider voice client. No Pipecat. Architecture:
//   mic → MediaRecorder(opus) → Deepgram WS (STT, multilingual)
//   on utterance end → POST /api/voice/chat with FULL message history
//   reply text → POST /api/voice/silk-mint → SILK WS → Web Audio playback
// Conversation history is kept in a ref so each LLM call has full context.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PhoneOff } from "lucide-react";
import Sigil from "./Sigil";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CallState = "connecting" | "live" | "error";
type ChatMessage = { role: "user" | "assistant"; content: string };

interface Counsellor {
    slug: string;
    name: string;
    portrait: string;
    specialties: string[];
    languages: string[];
    experienceYears: number;
    tagline?: string | null;
    signature?: string | null;
    hometown?: string | null;
    region?: string | null;
    personaPrompt?: string | null;
}

export interface UserProfile {
    displayName: string;
    gender: "male" | "female" | null;
    birthDate: string | null;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    birthPlace: string | null;
}

export default function VoiceCallClient({ counsellor, profile }: { counsellor: Counsellor; profile?: UserProfile }) {
    const router = useRouter();
    const [state, setState] = useState<CallState>("connecting");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastUserText, setLastUserText] = useState<string | null>(null);
    const [lastBotText, setLastBotText] = useState<string | null>(null);

    const startCall = useMutation(api.calls.start);
    const appendTurn = useMutation(api.calls.appendTurn);
    const endCall = useMutation(api.calls.end);

    const startedRef = useRef(false);
    const callIdRef = useRef<Id<"calls"> | null>(null);
    const callIdPromiseRef = useRef<Promise<Id<"calls">> | null>(null);
    const messagesRef = useRef<ChatMessage[]>([]);
    const dgWsRef = useRef<WebSocket | null>(null);
    const micCtxRef = useRef<AudioContext | null>(null);
    const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const ttsWsRef = useRef<WebSocket | null>(null);
    const ttsSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const playAtRef = useRef(0);
    const ttsGenRef = useRef(0);
    const inFlightChatRef = useRef<AbortController | null>(null);
    const dgKeepAliveRef = useRef<number | null>(null);

    const stopPlayback = useCallback(() => {
        ttsGenRef.current += 1;
        if (ttsWsRef.current && ttsWsRef.current.readyState === WebSocket.OPEN) {
            try { ttsWsRef.current.close(); } catch {}
        }
        ttsWsRef.current = null;
        for (const src of ttsSourcesRef.current) {
            try { src.stop(); } catch {}
        }
        ttsSourcesRef.current = [];
        if (audioCtxRef.current) {
            playAtRef.current = audioCtxRef.current.currentTime;
        }
    }, []);

    const speak = useCallback(async (text: string) => {
        stopPlayback();

        const myGen = ttsGenRef.current + 1;
        ttsGenRef.current = myGen;

        const mintRes = await fetch("/api/voice/silk-mint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, counsellorSlug: counsellor.slug }),
        });
        if (!mintRes.ok) {
            console.error("silk-mint failed", await mintRes.text());
            return;
        }
        const { ws_url, token, model, tone, description } = await mintRes.json();
        if (myGen !== ttsGenRef.current) return; // user interrupted while minting

        const ctx = audioCtxRef.current ?? new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();
        if (playAtRef.current < ctx.currentTime) playAtRef.current = ctx.currentTime;

        // muga expects a [tone] prefix; mulberry uses the description field instead
        const isMuga = model === "muga";
        const synthesisText = isMuga
            ? (text.trimStart().startsWith("[") ? text : `[${tone || "neutral"}] ${text}`)
            : text;

        const ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
        ws.binaryType = "arraybuffer";
        ttsWsRef.current = ws;

        ws.onopen = () => {
            if (myGen !== ttsGenRef.current) {
                try { ws.close(); } catch {}
                return;
            }
            const frame: Record<string, unknown> = { text: synthesisText };
            if (!isMuga && description) frame.description = description;
            ws.send(JSON.stringify(frame));
        };

        ws.onmessage = (e) => {
            if (myGen !== ttsGenRef.current) {
                try { ws.close(); } catch {}
                return;
            }
            if (e.data instanceof ArrayBuffer) {
                const pcm = new Int16Array(e.data);
                if (!pcm.length) return;
                const buf = ctx.createBuffer(1, pcm.length, 24000);
                const ch = buf.getChannelData(0);
                for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.connect(ctx.destination);
                playAtRef.current = Math.max(playAtRef.current, ctx.currentTime);
                src.start(playAtRef.current);
                playAtRef.current += buf.duration;
                ttsSourcesRef.current.push(src);
                src.onended = () => {
                    ttsSourcesRef.current = ttsSourcesRef.current.filter((x) => x !== src);
                };
            } else {
                try {
                    const data = JSON.parse(e.data);
                    if (data?.type === "done" || data?.error) {
                        try { ws.close(); } catch {}
                    }
                } catch {}
            }
        };

        ws.onerror = (err) => console.error("SILK ws error", err);
        ws.onclose = () => {
            if (ttsWsRef.current === ws) ttsWsRef.current = null;
        };
    }, [stopPlayback, counsellor.slug]);

    const ensureCallStarted = useCallback(async (): Promise<Id<"calls">> => {
        if (callIdRef.current) return callIdRef.current;
        if (!callIdPromiseRef.current) {
            callIdPromiseRef.current = startCall({ counsellorSlug: counsellor.slug })
                .then((id) => { callIdRef.current = id; return id; });
        }
        return callIdPromiseRef.current;
    }, [startCall, counsellor.slug]);

    // single-shot non-streaming — reverted from streaming
    const handleUserTurn = useCallback(async (userText: string, opts?: { showInUi?: boolean }) => {
        const trimmed = userText.trim();
        if (!trimmed) return;

        messagesRef.current = [...messagesRef.current, { role: "user", content: trimmed }];
        if (opts?.showInUi !== false) setLastUserText(trimmed);
        setLastBotText(null);

        // skip the synthetic kickoff prompt
        if (opts?.showInUi !== false) {
            ensureCallStarted()
                .then((id) => appendTurn({ callId: id, role: "user", text: trimmed }))
                .catch((e) => console.error("[voice] persist user turn failed", e));
        }

        if (inFlightChatRef.current) inFlightChatRef.current.abort();
        const ac = new AbortController();
        inFlightChatRef.current = ac;

        try {
            const r = await fetch("/api/voice/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    counsellor: {
                        slug: counsellor.slug,
                        name: counsellor.name,
                        specialties: counsellor.specialties,
                        languages: counsellor.languages,
                        experienceYears: counsellor.experienceYears,
                        tagline: counsellor.tagline ?? null,
                        signature: counsellor.signature ?? null,
                        hometown: counsellor.hometown ?? null,
                        region: counsellor.region ?? null,
                        personaPrompt: counsellor.personaPrompt ?? null,
                    },
                    profile: profile ?? null,
                    messages: messagesRef.current,
                }),
                signal: ac.signal,
            });
            if (!r.ok) {
                console.error("chat failed", await r.text());
                return;
            }
            const { reply } = await r.json();
            if (!reply) return;
            messagesRef.current = [...messagesRef.current, { role: "assistant", content: reply }];
            setLastBotText(reply);
            ensureCallStarted()
                .then((id) => appendTurn({ callId: id, role: "bot", text: reply }))
                .catch((e) => console.error("[voice] persist bot turn failed", e));
            await speak(reply);
        } catch (e) {
            if ((e as { name?: string })?.name === "AbortError") return;
            console.error("chat err", e);
        } finally {
            if (inFlightChatRef.current === ac) inFlightChatRef.current = null;
        }
    }, [counsellor, profile, speak, appendTurn, ensureCallStarted]);

    useEffect(() => {
        // NOTE: do NOT guard with a ref-based "already started" check. Next.js
        // dev runs effects twice (React Strict Mode); a ref-guard makes the
        // second mount no-op after the first mount's cleanup already tore
        // everything down — so nothing ends up alive. Just let it re-init.
        let cancelled = false;
        startedRef.current = true;

        (async () => {
            try {
                // race with a timeout so we surface stuck permission prompt
                const stream = await Promise.race([
                    navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    }),
                    new Promise<MediaStream>((_, rej) =>
                        setTimeout(() => rej(new Error("Microphone permission timed out (check the browser permission prompt)")), 10000),
                    ),
                ]);
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;

                const keyRes = await fetch("/api/voice/deepgram-key");
                if (!keyRes.ok) throw new Error(`deepgram-key fetch failed: ${keyRes.status}`);
                const { key, error: keyErr } = await keyRes.json();
                if (keyErr || !key) throw new Error(keyErr || "no deepgram key returned");

                // Flux requires raw PCM linear16 via ScriptProcessor.
                // eot_timeout_ms controls how long Flux waits after speech before firing EndOfTurn.
                const micCtx = new AudioContext();
                micCtxRef.current = micCtx;
                const sr = micCtx.sampleRate; // typically 48000

                const params = new URLSearchParams({
                    model: "flux-general-multi",
                    encoding: "linear16",
                    sample_rate: String(sr),
                    eot_timeout_ms: "1500",
                });
                params.append("language_hint", "hi");
                params.append("language_hint", "en");

                const dgUrl = `wss://api.deepgram.com/v2/listen?${params.toString()}`;
                const dgWs = new WebSocket(dgUrl, ["token", key]);
                dgWsRef.current = dgWs;

                let interimBuf = "";

                dgWs.onopen = () => {
                    if (cancelled) {
                        try { dgWs.close(); } catch {}
                        return;
                    }

                    const source = micCtx.createMediaStreamSource(stream);
                    micSourceRef.current = source;
                    const processor = micCtx.createScriptProcessor(4096, 1, 1);
                    micProcessorRef.current = processor;
                    source.connect(processor);
                    // gain=0 so audio flows to Flux but the user doesn't hear themselves echoed
                    const mute = micCtx.createGain();
                    mute.gain.value = 0;
                    processor.connect(mute);
                    mute.connect(micCtx.destination);

                    processor.onaudioprocess = (e) => {
                        if (dgWs.readyState !== WebSocket.OPEN) return;
                        const f32 = e.inputBuffer.getChannelData(0);
                        const i16 = new Int16Array(f32.length);
                        for (let i = 0; i < f32.length; i++) {
                            const s = Math.max(-1, Math.min(1, f32[i]));
                            i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                        }
                        dgWs.send(i16.buffer);
                    };

                    setState("live");

                    const firstName = (profile?.displayName ?? "").trim().split(/\s+/)[0];
                    const kickoff = firstName
                        ? `Greet ${firstName} warmly using the salutation rule, introduce yourself, and ask kya guidance chahiye aaj.`
                        : "Greet the client warmly, introduce yourself, and ask kya guidance chahiye aaj.";
                    handleUserTurn(kickoff, { showInUi: false });
                };

                dgWs.onmessage = (e) => {
                    let msg: {
                        type?: string;
                        event?: string;
                        transcript?: string;
                        words?: { word?: string }[];
                    };
                    try { msg = JSON.parse(e.data); } catch { return; }

                    if (msg.type === "TurnInfo") {
                        const event = msg.event;
                        const text = (msg.transcript || "").trim();
                        if (event === "Update" && text) {
                            setLastUserText(text);
                            stopPlayback();
                            interimBuf = text;
                        } else if (event === "EndOfTurn" || event === "EagerEndOfTurn") {
                            const final = (text || interimBuf || "").trim();
                            interimBuf = "";
                            if (final) {
                                stopPlayback();
                                handleUserTurn(final);
                            }
                        } else if (event === "StartOfTurn" || event === "TurnResumed") {
                            stopPlayback();
                        }
                    } else if (msg.type === "Error") {
                        console.error("[voice] dg error:", msg);
                    }
                };

                dgWs.onerror = (err) => {
                    console.error("DG ws error", err);
                    setState("error");
                    setErrorMsg("Speech recognition failed");
                };
                dgWs.onclose = () => {
                    if (dgKeepAliveRef.current) {
                        clearInterval(dgKeepAliveRef.current);
                        dgKeepAliveRef.current = null;
                    }
                };
            } catch (err) {
                if (cancelled) return; // expected during strict-mode unmount
                console.error("[voice] bootstrap failed", err);
                setState("error");
                const m = (err as Error)?.message?.toLowerCase() ?? "";
                if (m.includes("permission") || m.includes("notallowed") || m.includes("denied")) {
                    setErrorMsg("Allow microphone access to start the call.");
                } else if (m.includes("timed out")) {
                    setErrorMsg("Microphone permission prompt timed out. Click the mic icon in the address bar to allow.");
                } else {
                    setErrorMsg((err as Error)?.message ?? "Failed to start call");
                }
            }
        })();

        return () => {
            cancelled = true;
            startedRef.current = false;
            stopPlayback();
            if (dgKeepAliveRef.current) {
                clearInterval(dgKeepAliveRef.current);
                dgKeepAliveRef.current = null;
            }
            if (micProcessorRef.current) {
                try { micProcessorRef.current.disconnect(); } catch {}
                micProcessorRef.current.onaudioprocess = null;
                micProcessorRef.current = null;
            }
            if (micSourceRef.current) {
                try { micSourceRef.current.disconnect(); } catch {}
                micSourceRef.current = null;
            }
            if (micCtxRef.current) {
                try { micCtxRef.current.close(); } catch {}
                micCtxRef.current = null;
            }
            if (dgWsRef.current) {
                try { dgWsRef.current.close(); } catch {}
                dgWsRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
            if (audioCtxRef.current) {
                try { audioCtxRef.current.close(); } catch {}
                audioCtxRef.current = null;
            }
            const id = callIdRef.current;
            if (id) {
                endCall({ callId: id }).catch((e) => console.error("[voice] end call (cleanup) failed", e));
            }
        };
    }, [handleUserTurn, profile?.displayName, stopPlayback, endCall]);

    const handleEnd = useCallback(() => {
        const id = callIdRef.current;
        if (id) {
            endCall({ callId: id }).catch((e) => console.error("[voice] end call failed", e));
        }
        router.push(`/dashboard/counsellor/${counsellor.slug}`);
    }, [router, counsellor.slug, endCall]);

    const stateCaption =
        state === "connecting" ? "Connecting…" :
        state === "live" ? "Live" :
        (errorMsg ?? "Error");

    return (
        <div className="relative flex h-[calc(100dvh-9rem)] min-h-0 flex-col items-center justify-center overflow-hidden px-6 py-4 text-center">
            {/* Ceremonial sigil halo behind the portrait */}
            <div className="absolute top-[12%] text-[var(--saffron)] opacity-[0.18] pointer-events-none">
                <Sigil size={340} weight={0.7} spin />
            </div>

            <p className="eyebrow relative text-[var(--ink-mute)]">In session with</p>
            <div className="relative mt-3 mb-1">
                <Image
                    src={counsellor.portrait}
                    alt={counsellor.name}
                    width={160}
                    height={160}
                    className="rounded-full object-cover h-40 w-40 ring-1 ring-[var(--card-border-strong)] shadow-[0_8px_30px_-12px_rgba(94,35,8,0.4)]"
                />
            </div>
            <h1
                className="relative mt-3 font-display text-3xl text-[var(--ink)]"
                style={{ fontVariationSettings: '"opsz" 80, "SOFT" 30' }}
            >
                {counsellor.name}
            </h1>
            {counsellor.hometown && (
                <p className="relative text-xs text-[var(--ink-faint)] mt-0.5">{counsellor.hometown}</p>
            )}

            <div className="relative mt-3 flex items-center gap-2 justify-center">
                {state === "live" ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--peacock-wash)] border border-[var(--peacock-soft)]/50 px-3 py-1 text-[var(--peacock)] text-xs font-semibold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--peacock-soft)] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--peacock)]" />
                        </span>
                        Live session
                    </span>
                ) : state === "error" ? (
                    <p className="text-[var(--sindoor)] text-sm max-w-xs italic" style={{ fontFamily: "var(--font-display)" }}>
                        {stateCaption}
                    </p>
                ) : (
                    <p className="text-[var(--ink-faint)] text-sm italic" style={{ fontFamily: "var(--font-display)" }}>
                        {stateCaption}
                    </p>
                )}
            </div>

            {state === "connecting" && (
                <div className="relative mt-3 flex gap-1 justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--saffron)] animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--saffron)] animate-pulse [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--saffron)] animate-pulse [animation-delay:300ms]" />
                </div>
            )}

            {state === "live" && (
                <div className="relative mt-6 max-h-[34dvh] min-h-0 w-full max-w-sm space-y-2 overflow-hidden">
                    {lastUserText && (
                        <div className="flex justify-end">
                            <div className="bg-[var(--paper-deep)] border border-[var(--card-border-strong)] rounded-2xl rounded-br-sm px-4 py-2 text-sm text-[var(--ink-soft)] max-w-[80%] break-words text-left">
                                {lastUserText}
                            </div>
                        </div>
                    )}
                    {lastBotText && (
                        <div className="flex justify-start">
                            <div
                                className="bg-[var(--saffron-wash)] border border-[var(--saffron-soft)]/50 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-[var(--saffron-ink)] max-w-[80%] break-words text-left italic"
                                style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 14' }}
                            >
                                {lastBotText}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={handleEnd}
                className="relative mt-8 inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--sindoor)] px-6 py-3 font-semibold text-[var(--paper)] transition-transform active:scale-95 shadow-[0_4px_16px_-6px_rgba(168,35,26,0.5)]"
            >
                <PhoneOff size={17} strokeWidth={2} /> End session
            </button>
        </div>
    );
}
