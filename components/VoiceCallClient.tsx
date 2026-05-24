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

type CallState = "connecting" | "live" | "error";
type ChatMessage = { role: "user" | "assistant"; content: string };

interface Counsellor {
    slug: string;
    name: string;
    portrait: string;
    specialties: string[];
    languages: string[];
    experienceYears: number;
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

    // --- mutable refs (don't trigger re-render) ---
    const startedRef = useRef(false);
    const messagesRef = useRef<ChatMessage[]>([]);
    const dgWsRef = useRef<WebSocket | null>(null);
    const micCtxRef = useRef<AudioContext | null>(null);
    const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null); // separate ctx for 24kHz TTS playback
    const ttsWsRef = useRef<WebSocket | null>(null);
    const ttsSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const playAtRef = useRef(0);
    const ttsGenRef = useRef(0); // bumped to invalidate any in-flight TTS
    const inFlightChatRef = useRef<AbortController | null>(null);
    const dgKeepAliveRef = useRef<number | null>(null);

    // ----- TTS playback -----
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
        // Cancel any in-flight TTS first (interruption)
        stopPlayback();

        const myGen = ttsGenRef.current + 1;
        ttsGenRef.current = myGen;

        const mintRes = await fetch("/api/voice/silk-mint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (!mintRes.ok) {
            console.error("silk-mint failed", await mintRes.text());
            return;
        }
        const { ws_url, token, tone } = await mintRes.json();
        if (myGen !== ttsGenRef.current) return; // user interrupted while minting

        const ctx = audioCtxRef.current ?? new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();
        if (playAtRef.current < ctx.currentTime) playAtRef.current = ctx.currentTime;

        const tonePrefix = text.trimStart().startsWith("[") ? "" : `[${tone || "neutral"}] `;

        const ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);
        ws.binaryType = "arraybuffer";
        ttsWsRef.current = ws;

        ws.onopen = () => {
            if (myGen !== ttsGenRef.current) {
                try { ws.close(); } catch {}
                return;
            }
            // Send synthesis frame (per Rumik docs). For muga, only `text` matters.
            ws.send(JSON.stringify({ text: tonePrefix + text }));
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
    }, [stopPlayback]);

    // ----- LLM turn -----
    const handleUserTurn = useCallback(async (userText: string, opts?: { showInUi?: boolean }) => {
        const trimmed = userText.trim();
        if (!trimmed) return;

        // Append to history
        messagesRef.current = [...messagesRef.current, { role: "user", content: trimmed }];
        if (opts?.showInUi !== false) setLastUserText(trimmed);
        setLastBotText(null);

        // Cancel any in-flight chat from a previous (unfinished) turn
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
            await speak(reply);
        } catch (e) {
            if ((e as { name?: string })?.name === "AbortError") return;
            console.error("chat err", e);
        } finally {
            if (inFlightChatRef.current === ac) inFlightChatRef.current = null;
        }
    }, [counsellor, profile, speak]);

    // ----- Bootstrap call -----
    useEffect(() => {
        // NOTE: do NOT guard with a ref-based "already started" check. Next.js
        // dev runs effects twice (React Strict Mode); a ref-guard makes the
        // second mount no-op after the first mount's cleanup already tore
        // everything down — so nothing ends up alive. Just let it re-init.
        let cancelled = false;
        startedRef.current = true;

        (async () => {
            try {
                // 1. Get mic — race with a timeout so we surface stuck permission
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
                console.log("[voice] mic OK");

                // 2. Fetch Deepgram key
                const keyRes = await fetch("/api/voice/deepgram-key");
                if (!keyRes.ok) throw new Error(`deepgram-key fetch failed: ${keyRes.status}`);
                const { key, error: keyErr } = await keyRes.json();
                if (keyErr || !key) throw new Error(keyErr || "no deepgram key returned");
                console.log("[voice] dg key OK");

                // 3. Open Deepgram Flux WS (Hinglish-capable, /v2/listen)
                //    Flux requires raw PCM linear16 — we set up ScriptProcessor
                //    below to send that. eot_timeout_ms controls how long Flux
                //    waits after speech before firing EndOfTurn.
                const micCtx = new AudioContext();
                micCtxRef.current = micCtx;
                const sr = micCtx.sampleRate; // typically 48000

                const params = new URLSearchParams({
                    model: "flux-general-multi",
                    encoding: "linear16",
                    sample_rate: String(sr),
                    eot_timeout_ms: "1500",
                });
                // Flux supports repeated language_hint params for multilingual
                params.append("language_hint", "hi");
                params.append("language_hint", "en");

                const dgUrl = `wss://api.deepgram.com/v2/listen?${params.toString()}`;
                const dgWs = new WebSocket(dgUrl, ["token", key]);
                dgWsRef.current = dgWs;

                let interimBuf = "";

                dgWs.onopen = () => {
                    console.log("[voice] dg flux ws open", { sampleRate: sr });
                    if (cancelled) {
                        try { dgWs.close(); } catch {}
                        return;
                    }

                    // 4. Stream raw PCM linear16 from mic → Flux
                    const source = micCtx.createMediaStreamSource(stream);
                    micSourceRef.current = source;
                    const processor = micCtx.createScriptProcessor(4096, 1, 1);
                    micProcessorRef.current = processor;
                    source.connect(processor);
                    // Connect to destination so audio actually flows; we mute by routing
                    // through a gain=0 node so the user doesn't hear themselves echoed.
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

                    // 5. Kick off intro turn — let the bot greet the (already-known) client.
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
                            // Interim transcript; show it and interrupt bot audio
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
                            // User started talking — kill bot audio
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
            // Tear everything down
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
        };
    }, [handleUserTurn, profile?.displayName, stopPlayback]);

    const handleEnd = useCallback(() => {
        router.push(`/dashboard/counsellor/${counsellor.slug}`);
    }, [router, counsellor.slug]);

    const stateCaption =
        state === "connecting" ? "Connecting…" :
        state === "live" ? "Live" :
        (errorMsg ?? "Error");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <Image
                src={counsellor.portrait}
                alt={counsellor.name}
                width={160}
                height={160}
                className="rounded-full object-cover h-40 w-40"
            />
            <h1 className="mt-4 text-2xl font-bold">{counsellor.name}</h1>

            <div className="mt-2 flex items-center gap-2 justify-center">
                {state === "live" ? (
                    <>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-emerald-600 font-semibold text-sm">Live</span>
                    </>
                ) : state === "error" ? (
                    <p className="text-red-500 text-sm max-w-xs">{stateCaption}</p>
                ) : (
                    <p className="text-zinc-500 text-sm">{stateCaption}</p>
                )}
            </div>

            {state === "connecting" && (
                <div className="mt-3 flex gap-1 justify-center">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:300ms]" />
                </div>
            )}

            {state === "live" && (
                <div className="mt-6 w-full max-w-sm space-y-2">
                    {lastUserText && (
                        <div className="bg-zinc-100 rounded-2xl rounded-br-sm px-4 py-2 text-sm text-zinc-700 ml-auto max-w-[80%] text-right">
                            {lastUserText}
                        </div>
                    )}
                    {lastBotText && (
                        <div className="bg-emerald-50 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-emerald-900 max-w-[80%] text-left">
                            {lastBotText}
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={handleEnd}
                className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold active:scale-95 transition-transform"
            >
                <PhoneOff size={18} /> End
            </button>
        </div>
    );
}
