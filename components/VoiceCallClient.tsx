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

export default function VoiceCallClient({ counsellor }: { counsellor: Counsellor }) {
    const router = useRouter();
    const [state, setState] = useState<CallState>("connecting");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastUserText, setLastUserText] = useState<string | null>(null);
    const [lastBotText, setLastBotText] = useState<string | null>(null);

    // --- mutable refs (don't trigger re-render) ---
    const startedRef = useRef(false);
    const messagesRef = useRef<ChatMessage[]>([]);
    const dgWsRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
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
    const handleUserTurn = useCallback(async (userText: string) => {
        const trimmed = userText.trim();
        if (!trimmed) return;

        // Append to history
        messagesRef.current = [...messagesRef.current, { role: "user", content: trimmed }];
        setLastUserText(trimmed);
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
    }, [counsellor, speak]);

    // ----- Bootstrap call -----
    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        let cancelled = false;

        (async () => {
            try {
                // 1. Get mic
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;

                // 2. Fetch Deepgram key
                const keyRes = await fetch("/api/voice/deepgram-key");
                if (!keyRes.ok) throw new Error("deepgram-key fetch failed");
                const { key } = await keyRes.json();

                // 3. Open Deepgram WS
                //    nova-3 supports multilingual via `language=multi`.
                //    utterance_end_ms=1000 → server emits a UtteranceEnd event
                //    after 1s of silence so we know the user is done.
                const params = new URLSearchParams({
                    model: "nova-3",
                    language: "multi",
                    smart_format: "true",
                    punctuate: "true",
                    interim_results: "true",
                    vad_events: "true",
                    utterance_end_ms: "1000",
                    endpointing: "300",
                });
                const dgUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
                const dgWs = new WebSocket(dgUrl, ["token", key]);
                dgWsRef.current = dgWs;

                let interimBuf = "";

                dgWs.onopen = () => {
                    if (cancelled) {
                        try { dgWs.close(); } catch {}
                        return;
                    }
                    // 4. Start streaming mic audio (opus container; Deepgram auto-detects)
                    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
                    recorderRef.current = recorder;
                    recorder.ondataavailable = (e) => {
                        if (e.data.size > 0 && dgWs.readyState === WebSocket.OPEN) {
                            dgWs.send(e.data);
                        }
                    };
                    recorder.start(250);

                    // Deepgram needs a periodic keepalive on long silences
                    dgKeepAliveRef.current = window.setInterval(() => {
                        if (dgWs.readyState === WebSocket.OPEN) {
                            dgWs.send(JSON.stringify({ type: "KeepAlive" }));
                        }
                    }, 8000);

                    setState("live");

                    // 5. Kick off intro turn
                    // Empty message history + counsellor → the system prompt asks
                    // for the warm Hinglish greeting.
                    handleUserTurn("Greet the client warmly and ask kya guidance chahiye aaj.");
                };

                dgWs.onmessage = (e) => {
                    let msg: { type?: string; channel?: { alternatives?: { transcript?: string }[] }; is_final?: boolean; speech_final?: boolean };
                    try { msg = JSON.parse(e.data); } catch { return; }

                    if (msg.type === "Results") {
                        const text = msg.channel?.alternatives?.[0]?.transcript ?? "";
                        if (!text) return;
                        if (msg.is_final) {
                            interimBuf = (interimBuf + " " + text).trim();
                            // If speech_final, Deepgram thinks utterance done → trigger
                            if (msg.speech_final) {
                                const final = interimBuf;
                                interimBuf = "";
                                if (final) {
                                    // User started talking → interrupt any bot audio
                                    stopPlayback();
                                    handleUserTurn(final);
                                }
                            }
                        } else {
                            // Interim: show what we're hearing AND interrupt bot mid-sentence
                            setLastUserText(text);
                            stopPlayback();
                        }
                    } else if (msg.type === "UtteranceEnd") {
                        // Backstop: trigger if endpointing missed it
                        const final = interimBuf;
                        interimBuf = "";
                        if (final) handleUserTurn(final);
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
                console.error("call bootstrap failed", err);
                setState("error");
                const m = (err as Error)?.message?.toLowerCase() ?? "";
                if (m.includes("permission") || m.includes("notallowed")) {
                    setErrorMsg("Allow microphone access to start the call.");
                } else {
                    setErrorMsg((err as Error)?.message ?? "Failed to start call");
                }
            }
        })();

        return () => {
            cancelled = true;
            // Tear everything down
            stopPlayback();
            if (dgKeepAliveRef.current) {
                clearInterval(dgKeepAliveRef.current);
                dgKeepAliveRef.current = null;
            }
            if (recorderRef.current && recorderRef.current.state !== "inactive") {
                try { recorderRef.current.stop(); } catch {}
            }
            recorderRef.current = null;
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
    }, [handleUserTurn, stopPlayback]);

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
