<p align="center">
  <img src="public/logo.png" alt="Tara" width="96" height="96" />
</p>

<h1 align="center">Tara</h1>

<p align="center">Call or chat with a verified astrologer in minutes. Voice-first, Hinglish, real-time.</p>

<p align="center">
  <a href="https://youtu.be/A9E0XC5RAlw"><b>▶ Watch the demo</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Convex-backend-EE342F?logo=convex&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue" />
</p>

## What it is

A platform where users pick a counsellor, share their birth chart, and either start a low-latency voice call or a text chat. STT runs in the browser via Deepgram Flux, the LLM is Gemini, and the voice is Rumik SILK streamed over WebSocket.

## Stack

- **Web** — Next.js 16 App Router, React 19, Tailwind 4
- **Backend** — Convex (DB + functions + auth bridge)
- **Auth** — better-auth with `@convex-dev/better-auth`
- **Voice** — Deepgram Flux (STT) · Gemini Flash Lite (LLM) · Rumik SILK (TTS)
- **Chat** — Gemini 2.5 Flash, persisted in Convex
- **Voice agent (optional)** — Pipecat server in `voice-agent/`, not used by the default browser-direct flow

## Run it

```bash
pnpm install
pnpm dev   # next + convex in parallel
```

Set in `.env.local`:

```
GEMINI_API_KEY=...        # or GOOGLE_API_KEY
DEEPGRAM_API_KEY=...
RUMIK_API_KEY=...         # or SILK_API_KEY
SITE_URL=http://localhost:3000
```

First run also pulls Convex env via `npx convex dev`.

## Layout

```
app/(auth)        sign-in / sign-up
app/(dashboard)   home, counsellor pages, call, chat, profile
app/(public)      landing, about / terms / privacy
app/api/voice     STT / LLM / TTS routes
app/api/ai-chat   text-chat endpoint
convex/           schema, queries, auth, counsellor seed, chat
voice-agent/      pipecat server (optional)
```

## License

[GPL-3.0](./LICENSE). See `LICENSE` for the full text.
