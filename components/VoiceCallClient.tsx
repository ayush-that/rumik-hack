"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PhoneOff } from "lucide-react";
import {
  PipecatClient,
  TranscriptData,
  BotTTSTextData,
  DeviceError,
} from "@pipecat-ai/client-js";
import { PipecatClientProvider, PipecatClientAudio } from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CallState = "idle" | "connecting" | "connected" | "error";

interface Counsellor {
  slug: string;
  name: string;
  portrait: string;
  specialties: string[];
  languages: string[];
  experienceYears: number;
}

interface Props {
  counsellor: Counsellor;
}

function VoiceCallInner({ counsellor, client }: Props & { client: PipecatClient }) {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUserText, setLastUserText] = useState<string | null>(null);
  const [lastBotText, setLastBotText] = useState<string | null>(null);
  const startedRef = useRef(false);

  const startCall = useMutation(api.calls.start);
  const appendTurn = useMutation(api.calls.appendTurn);
  const endCall = useMutation(api.calls.end);
  const callIdRef = useRef<Id<"calls"> | null>(null);
  const botTextRef = useRef<string>("");

  const agentUrl =
    process.env.NEXT_PUBLIC_VOICE_AGENT_URL ?? "http://localhost:7860";

  const connectParams = useMemo(
    () => ({
      webrtcRequestParams: {
        endpoint: `${agentUrl}/api/offer`,
        requestData: {
          counsellor: {
            slug: counsellor.slug,
            name: counsellor.name,
            specialties: counsellor.specialties,
            languages: counsellor.languages,
            experienceYears: counsellor.experienceYears,
          },
        },
      },
    }),
    [agentUrl, counsellor]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    setCallState("connecting");

    // Wire up callbacks on the shared client
    client.on("transportStateChanged", (state) => {
      if (state === "connected" || state === "ready") {
        setCallState("connected");
      } else if (state === "disconnected" || state === "disconnecting") {
        setCallState("idle");
      } else if (state === "error") {
        setCallState("error");
        setErrorMsg("Connection error. Please try again.");
      } else {
        setCallState("connecting");
      }
    });

    client.on("userTranscript", (data: TranscriptData) => {
      if (data.final) {
        setLastUserText(data.text);
        const cid = callIdRef.current;
        const text = data.text?.trim();
        if (cid && text) {
          appendTurn({ callId: cid, role: "user", text }).catch(() => {});
        }
      }
    });

    client.on("botTtsText", (data: BotTTSTextData) => {
      setLastBotText((prev) => (prev ? prev + " " + data.text : data.text));
      botTextRef.current = botTextRef.current
        ? botTextRef.current + " " + data.text
        : data.text;
    });

    client.on("botStartedSpeaking", () => {
      setLastBotText(null);
      botTextRef.current = "";
    });

    client.on("botStoppedSpeaking", () => {
      const cid = callIdRef.current;
      const text = botTextRef.current.trim();
      botTextRef.current = "";
      if (cid && text) {
        appendTurn({ callId: cid, role: "bot", text }).catch(() => {});
      }
    });

    client.on("disconnected", () => {
      setCallState("idle");
      const cid = callIdRef.current;
      if (cid) {
        endCall({ callId: cid }).catch(() => {});
      }
    });

    client.on("deviceError", (err: DeviceError) => {
      if (err.type === "permissions") {
        setErrorMsg("Allow microphone access to start the call.");
      } else {
        setErrorMsg(`Microphone error: ${err.message}`);
      }
      setCallState("error");
    });

    startCall({ counsellorSlug: counsellor.slug })
      .then((id) => {
        callIdRef.current = id;
      })
      .catch(() => {});

    client.connect(connectParams).catch((err: unknown) => {
      startedRef.current = false;
      const msg =
        err instanceof Error ? err.message : "Failed to start call.";
      if (
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("notallowed") ||
        msg.toLowerCase().includes("mic")
      ) {
        setErrorMsg("Allow microphone access to start the call.");
      } else {
        setErrorMsg(msg);
      }
      setCallState("error");
      const cid = callIdRef.current;
      if (cid) endCall({ callId: cid }).catch(() => {});
    });

    return () => {
      client.disconnect().catch(() => {});
      const cid = callIdRef.current;
      if (cid) endCall({ callId: cid }).catch(() => {});
    };
  }, [client, connectParams, counsellor.slug, startCall, appendTurn, endCall]);

  const handleEnd = useCallback(async () => {
    try {
      await client.disconnect();
    } catch {
      // best-effort
    }
    const cid = callIdRef.current;
    if (cid) {
      try { await endCall({ callId: cid }); } catch {}
    }
    router.push("/dashboard/call");
  }, [client, endCall, router]);

  const stateCaption =
    callState === "connecting"
      ? "Connecting…"
      : callState === "connected"
        ? "Live"
        : callState === "error"
          ? (errorMsg ?? "Error")
          : "Ready";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <PipecatClientAudio />

      <Image
        src={counsellor.portrait}
        alt={counsellor.name}
        width={160}
        height={160}
        className="rounded-full object-cover h-40 w-40"
      />

      <h1 className="mt-4 text-2xl font-bold">{counsellor.name}</h1>

      {/* State indicator */}
      <div className="mt-2 flex items-center gap-2 justify-center">
        {callState === "connected" ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-emerald-600 font-semibold text-sm">
              Live
            </span>
          </>
        ) : callState === "error" ? (
          <p className="text-red-500 text-sm max-w-xs">{stateCaption}</p>
        ) : (
          <p className="text-zinc-500 text-sm">{stateCaption}</p>
        )}
      </div>

      {/* Animated dots while connecting */}
      {callState === "connecting" && (
        <div className="mt-3 flex gap-1 justify-center">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:300ms]" />
        </div>
      )}

      {/* Transcript area — shows last user turn and last bot turn */}
      {callState === "connected" && (
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

      {/* End button */}
      <button
        onClick={handleEnd}
        className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold active:scale-95 transition-transform"
      >
        <PhoneOff size={18} /> End
      </button>
    </div>
  );
}

export default function VoiceCallClient({ counsellor }: Props) {
  // Defer Pipecat/Daily instantiation to client mount — Daily.createCallObject()
  // touches WebRTC globals that don't exist during SSR.
  const [client, setClient] = useState<PipecatClient | null>(null);

  useEffect(() => {
    const c = new PipecatClient({
      transport: new SmallWebRTCTransport(),
      enableMic: true,
      enableCam: false,
    });
    setClient(c);
    return () => {
      c.disconnect().catch(() => {});
    };
  }, []);

  if (!client) {
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
        <p className="text-zinc-500 text-sm mt-2">Preparing…</p>
      </div>
    );
  }

  // client-react redeclares PipecatClient locally in its typedefs instead of
  // re-exporting it from client-js, so we need a cast to satisfy the Provider prop.
  // At runtime both refer to the same class.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providerClient = client as any;

  return (
    <PipecatClientProvider client={providerClient}>
      <VoiceCallInner counsellor={counsellor} client={client} />
    </PipecatClientProvider>
  );
}
