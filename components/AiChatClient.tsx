"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Phone,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api } from "@/convex/_generated/api";

export type ChatCounsellor = {
  slug: string;
  name: string;
  portrait: string;
  specialties: string[];
  languages: string[];
  experienceYears: number;
};

export type ChatProfile = {
  displayName: string;
  gender: "male" | "female" | null;
  birthDate: string | null;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  kind?: "text" | "voice";
};

type AudioNote = {
  status: "loading" | "ready" | "error";
  url?: string;
};

type RecordedVoiceNote = {
  blob: Blob;
  url: string;
};

const MALE_COUNSELLORS = new Set(["devrajit", "parasharya", "jeeshan", "rohan", "amit"]);

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function firstName(profile: ChatProfile) {
  return profile.displayName.trim().split(/\s+/)[0] || profile.displayName;
}

// Voice note when the reply is meaningfully long: either ≥320 chars, or 3+ sentences.
const VOICE_NOTE_MIN_CHARS = 320;
const VOICE_NOTE_MIN_SENTENCES = 3;
function assistantKindFor(text: string): "text" | "voice" {
  const trimmed = text.trim();
  if (trimmed.length >= VOICE_NOTE_MIN_CHARS) return "voice";
  const sentences = trimmed.split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  return sentences.length >= VOICE_NOTE_MIN_SENTENCES ? "voice" : "text";
}

function greetingFor(counsellor: ChatCounsellor, profile: ChatProfile): Message {
  return {
    id: `intro-${counsellor.slug}`,
    role: "assistant",
    kind: "text",
    createdAt: Date.now(),
    content: `Namaste ${firstName(profile)}, I am ${counsellor.name}. I have your birth details with me, so tell me what is on your mind today and I will guide you step by step.`,
  };
}

function apiProfile(profile: ChatProfile) {
  return {
    name: profile.displayName,
    dob: profile.birthDate ?? "",
    birthPlace: profile.birthPlace ?? "",
    birthTime: profile.birthTimeUnknown ? undefined : profile.birthTime ?? undefined,
  };
}

function counsellorVoiceDescription(counsellor: ChatCounsellor) {
  const gender = MALE_COUNSELLORS.has(counsellor.slug) ? "male" : "female";
  const warmth = gender === "male" ? "warm, mature male Indian astrology counsellor" : "warm, reassuring female Indian astrology counsellor";
  return `${warmth}, natural Hinglish, calm phone-call voice, clear and empathetic`;
}

function toneFor(text: string) {
  if (/\b(sorry|pain|hurt|sad|stress|anxious|breakup|loss|health|legal|worry|difficult)\b/i.test(text)) {
    return "sad";
  }
  if (/\b(great|good news|excited|happy|win|congratulations)\b/i.test(text)) {
    return "excited";
  }
  return "happy";
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));
}

function preferredRecordingType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

async function readError(response: Response) {
  try {
    const body = await response.json();
    if (typeof body.detail === "string" && body.detail.trim()) {
      return body.error ? `${body.error}: ${body.detail}` : body.detail;
    }
    return body.error || "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export default function AiChatClient({
  counsellor,
  profile,
}: {
  counsellor: ChatCounsellor;
  profile: ChatProfile;
}) {
  const session = useQuery(api.chat.getSession, {
    counsellorSlug: counsellor.slug,
  });
  const appendMessage = useMutation(api.chat.appendMessage);

  const [messages, setMessages] = useState<Message[]>([greetingFor(counsellor, profile)]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioNotes, setAudioNotes] = useState<Record<string, AudioNote>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const audioUrlsRef = useRef<Set<string>>(new Set());
  const playGenRef = useRef(0);

  const stopAudio = useCallback(() => {
    playGenRef.current += 1;
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
    }
    audioRef.current = null;
    setPlayingId(null);
  }, []);

  const cleanupCaptureHardware = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stopRecorderToVoiceNote = useCallback(async (): Promise<RecordedVoiceNote | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      mediaRecorderRef.current = null;
      return null;
    }

    return await new Promise<RecordedVoiceNote | null>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const chunks = mediaChunksRef.current;
        mediaRecorderRef.current = null;
        mediaChunksRef.current = [];
        if (!chunks.length) {
          resolve(null);
          return;
        }
        const blob = new Blob(chunks, { type });
        resolve({ blob, url: URL.createObjectURL(blob) });
      };
      try { recorder.requestData(); } catch {}
      recorder.stop();
    });
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    const savedMessages = session.messages.map((message) => ({
      id: message._id,
      role: message.role,
      kind: message.role === "assistant" ? assistantKindFor(message.content) : "text" as const,
      content: message.content,
      createdAt: message.createdAt,
    }));

    setMessages(savedMessages.length > 0 ? savedMessages : [greetingFor(counsellor, profile)]);
    setInput("");
    setError(null);
    stopAudio();
  }, [counsellor, profile, session, stopAudio]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  useEffect(() => {
    const audioUrls = audioUrlsRef.current;
    return () => {
      stopAudio();
      cleanupCaptureHardware();
      for (const url of audioUrls) {
        URL.revokeObjectURL(url);
      }
      audioUrls.clear();
    };
  }, [cleanupCaptureHardware, stopAudio]);

  async function synthesizeVoiceNote(text: string, id: string) {
    const existing = audioNotes[id];
    if (existing?.url) return existing.url;

    setAudioNotes((current) => ({ ...current, [id]: { status: "loading" } }));
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model: "mulberry",
        description: counsellorVoiceDescription(counsellor),
        tone: toneFor(text),
      }),
    });

    if (!response.ok) {
      setAudioNotes((current) => ({ ...current, [id]: { status: "error" } }));
      throw new Error(await readError(response));
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    audioUrlsRef.current.add(url);
    setAudioNotes((current) => ({ ...current, [id]: { status: "ready", url } }));
    return url;
  }

  async function playVoiceNote(message: Message) {
    if (playingId === message.id) {
      stopAudio();
      return;
    }

    stopAudio();
    const myGen = playGenRef.current;

    try {
      const url = audioNotes[message.id]?.url ?? await synthesizeVoiceNote(message.content, message.id);
      if (myGen !== playGenRef.current) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingId(message.id);
      audio.onended = () => { if (myGen === playGenRef.current) stopAudio(); };
      audio.onerror = () => { if (myGen === playGenRef.current) stopAudio(); };
      await audio.play();
      if (myGen !== playGenRef.current) {
        try { audio.pause(); } catch {}
      }
    } catch (err) {
      if (myGen === playGenRef.current) {
        setError(err instanceof Error ? err.message : "Audio playback failed.");
      }
    }
  }

  async function transcribeVoiceNote(blob: Blob) {
    const form = new FormData();
    form.append("audio", blob, `voice-note.${blob.type.includes("mp4") ? "m4a" : "webm"}`);

    const response = await fetch("/api/voice/transcribe", {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const body = await response.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      throw new Error("I recorded audio but could not hear clear words. Please try again closer to the mic.");
    }
    return text;
  }

  async function sendMessage(value = input, options?: { kind?: "text" | "voice"; audioUrl?: string | null }) {
    const text = value.trim();
    if (!text) return;

    setError(null);
    setInput("");

    const userMessage: Message = {
      id: newId("user"),
      role: "user",
      kind: options?.kind ?? "text",
      content: text,
      createdAt: Date.now(),
    };

    const userAudioUrl = options?.audioUrl ?? undefined;
    if (userAudioUrl) {
      audioUrlsRef.current.add(userAudioUrl);
      setAudioNotes((current) => ({
        ...current,
        [userMessage.id]: { status: "ready", url: userAudioUrl },
      }));
    }

    // Functional setter so back-to-back sends don't lose the previous one (stale-closure race).
    let nextMessages: Message[] = [];
    setMessages((current) => {
      nextMessages = [...current, userMessage];
      return nextMessages;
    });
    setIsSending(true);

    try {
      await appendMessage({
        counsellorSlug: counsellor.slug,
        role: "user",
        content: userMessage.content,
      });

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counsellor,
          profile: apiProfile(profile),
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const body = await response.json();
      const assistantMessage: Message = {
        id: newId("assistant"),
        role: "assistant",
        kind: assistantKindFor(body.text ?? ""),
        content: body.text,
        createdAt: Date.now(),
      };
      setMessages((current) => [...current, assistantMessage]);

      await appendMessage({
        counsellorSlug: counsellor.slug,
        role: "assistant",
        content: assistantMessage.content,
      });

      if (voiceReplies) {
        playVoiceNote(assistantMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  }

  async function startVoiceCapture() {
    if (isRecording || isTranscribing) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone recording is not available in this browser.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Voice note recording is not available in this browser.");
      return;
    }

    setError(null);
    setInput("");
    stopAudio();
    mediaChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;

      const mimeType = preferredRecordingType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.start(250);

      setIsRecording(true);
    } catch (err) {
      cleanupCaptureHardware();
      const message = err instanceof Error ? err.message : "Could not capture your voice.";
      if (/permission|notallowed|denied/i.test(message)) {
        setError("Allow microphone access, then tap the mic again.");
      } else {
        setError(message);
      }
      setIsRecording(false);
    }
  }

  async function stopVoiceCapture(shouldSend = true) {
    if (!isRecording) return;
    setIsRecording(false);
    const voiceNote = await stopRecorderToVoiceNote();
    cleanupCaptureHardware();

    if (!shouldSend) {
      if (voiceNote) URL.revokeObjectURL(voiceNote.url);
      setInput("");
      return;
    }

    if (!voiceNote) {
      setError("I could not save the voice note. Please try again.");
      return;
    }

    setIsTranscribing(true);
    try {
      const transcript = await transcribeVoiceNote(voiceNote.blob);
      await sendMessage(transcript, { kind: "voice", audioUrl: voiceNote.url });
    } catch (err) {
      URL.revokeObjectURL(voiceNote.url);
      setError(err instanceof Error ? err.message : "Could not transcribe your voice note.");
    } finally {
      setIsTranscribing(false);
    }
  }

  const suggestions = [
    "I feel stuck in my career.",
    "Can you guide me about marriage?",
    "I am worried about money this month.",
  ];

  const sessionLoading = session === undefined;

  const renderVoiceNote = (message: Message, assistant: boolean, seen: boolean) => {
    const note = audioNotes[message.id];
    const loading = note?.status === "loading";
    const playing = playingId === message.id;
    const playable = Boolean(note?.url) || assistant;

    return (
      <div className="flex min-w-[210px] items-center gap-2">
        <button
          type="button"
          onClick={() => playVoiceNote(message)}
          disabled={!playable || loading}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
            assistant ? "bg-emerald-50 text-emerald-700" : "bg-white/70 text-zinc-800"
          } disabled:opacity-50`}
          aria-label={playing ? "Pause voice note" : "Play voice note"}
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : playing ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex h-7 items-center gap-0.5">
            {Array.from({ length: 22 }).map((_, i) => (
              <span
                key={i}
                className={`w-1 rounded-full ${assistant ? "bg-emerald-400/70" : "bg-zinc-500/55"}`}
                style={{ height: `${8 + ((i * 7) % 18)}px` }}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[10px] leading-none text-zinc-400">
            <span>{assistant ? "Voice note" : "Voice message"}</span>
            <span className="inline-flex items-center gap-1">
              {formatTime(message.createdAt)}
              {!assistant && (
                <CheckCheck
                  size={13}
                  strokeWidth={2.2}
                  className={seen ? "text-sky-500" : "text-zinc-400"}
                  aria-label={seen ? "Seen" : "Sent"}
                />
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="flex h-[calc(100vh-9rem)] min-h-[620px] flex-col overflow-hidden bg-[var(--background)]">
      <header className="shrink-0 border-b border-[var(--card-border)] bg-[var(--background)] px-3 py-3">
        <div className="rounded-2xl border border-amber-200 bg-[var(--accent-yellow)] px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/chat"
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-700 -ml-1"
              aria-label="Back to chats"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-amber-300 bg-white">
              <Image src={counsellor.portrait} alt={counsellor.name} fill sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-extrabold tracking-tight">{counsellor.name}</p>
              <p className="truncate text-xs font-semibold text-emerald-700">AI chat in progress</p>
              <p className="truncate text-xs text-zinc-700">{counsellor.specialties.join(", ")}</p>
            </div>
            <Link
              href={`/dashboard/call/${counsellor.slug}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-emerald-700"
              aria-label={`Call ${counsellor.name}`}
            >
              <Phone size={18} />
            </Link>
          </div>
        </div>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#f7f1e4] bg-[radial-gradient(circle_at_10px_10px,rgba(248,214,90,0.18)_1px,transparent_1px)] bg-[length:22px_22px] px-4 py-4"
      >
        {sessionLoading ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-500">
            Loading chat...
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            <div className="mx-auto w-fit rounded-full bg-white/85 px-3 py-1 text-center text-xs font-medium text-zinc-500 shadow-sm">
              Chat with {counsellor.name}
            </div>

            {messages.map((message, index) => {
              const assistant = message.role === "assistant";
              const seen = !assistant && messages.slice(index + 1).some((item) => item.role === "assistant");
              const voiceLike = message.kind === "voice";
              return (
                <div key={message.id} className={`flex ${assistant ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      assistant
                        ? "border border-zinc-100 bg-white text-zinc-800"
                        : "bg-[#fff9d7] text-zinc-800"
                    }`}
                    title={voiceLike ? message.content : undefined}
                  >
                    {voiceLike ? (
                      renderVoiceNote(message, assistant, seen)
                    ) : (
                      <>
                        <p>{message.content}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] leading-none text-zinc-400">
                          <span>{formatTime(message.createdAt)}</span>
                          <CheckCheck
                            size={13}
                            strokeWidth={2.2}
                            className={seen ? "text-sky-500" : "text-zinc-400"}
                            aria-label={seen ? "Seen" : "Sent"}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
                  <div className="mb-1 font-medium">{counsellor.name} is typing...</div>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (isTranscribing) return;
          if (isRecording) {
            stopVoiceCapture(true);
          } else {
            sendMessage();
          }
        }}
        className="shrink-0 border-t border-[var(--card-border)] bg-[var(--background)]/95 px-3 py-3 backdrop-blur"
      >
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto px-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => sendMessage(suggestion)}
              disabled={isRecording || isTranscribing}
              className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {(isRecording || isTranscribing) && (
          <div className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
            {isRecording ? "Recording voice note... tap send when you are done." : "Sending voice note..."}
          </div>
        )}

        {error && (
          <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 shadow-sm">
            {error}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex min-h-12 flex-1 items-end gap-1 rounded-[26px] border border-zinc-200 bg-white px-2 py-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (isRecording) {
                  stopVoiceCapture(false);
                } else {
                  startVoiceCapture();
                }
              }}
              disabled={isTranscribing}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full disabled:text-zinc-300 ${
                isRecording ? "bg-red-100 text-red-600" : "text-zinc-500"
              }`}
              aria-label={isRecording ? "Cancel voice note" : "Start voice note"}
            >
              {isRecording ? <MicOff size={19} /> : <Mic size={19} />}
            </button>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !isRecording && !isTranscribing) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isRecording || isTranscribing}
              rows={1}
              placeholder={isRecording ? "Recording voice note..." : isTranscribing ? "Sending voice note..." : "Message"}
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-1.5 text-[15px] leading-6 outline-none placeholder:text-zinc-400 disabled:text-zinc-500"
            />
            <button
              type="button"
              onClick={() => setVoiceReplies((value) => !value)}
              disabled={isRecording || isTranscribing}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full disabled:text-zinc-300 ${
                voiceReplies ? "bg-emerald-100 text-emerald-700" : "text-zinc-400"
              }`}
              aria-label={voiceReplies ? "Turn off spoken replies" : "Turn on spoken replies"}
            >
              {voiceReplies ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && !isRecording) || isTranscribing}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-900 text-white shadow-sm disabled:bg-zinc-300"
            aria-label={isRecording ? "Send voice note" : "Send message"}
          >
            {isTranscribing ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}
          </button>
        </div>
      </form>
    </section>
  );
}
