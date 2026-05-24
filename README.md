<p align="center">
  <img src="public/logo.png" alt="Cyrux" width="96" height="96" />
</p>

<h1 align="center">Cyrux</h1>

<p align="center">Call a verified astrologer in minutes. Voice-first, Hinglish, real-time.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Convex-backend-EE342F?logo=convex&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue" />
</p>

## What it is

A mobile-shaped web app where users pick a counsellor, share their birth chart, and talk to them on a low-latency voice call. STT runs in the browser via Deepgram Flux, the LLM is Gemini Flash Lite, and the voice is Rumik SILK streamed over WebSocket.

## Stack

- **Web** — Next.js 16 App Router, React 19, Tailwind 4
- **Backend** — Convex (DB + functions + auth bridge)
- **Auth** — better-auth with `@convex-dev/better-auth`
- **Voice** — Deepgram Flux (STT) · Gemini Flash Lite (LLM) · Rumik SILK (TTS)
- **Voice agent (legacy)** — Pipecat in `voice-agent/`, kept around but unused by default

## Run it

```bash
pnpm install
pnpm dev   # next + convex in parallel
```

Set in `.env.local`:

```
GEMINI_API_KEY=...
DEEPGRAM_API_KEY=...
RUMIK_API_KEY=...
SITE_URL=http://localhost:3000
```

First run also pulls Convex env via `npx convex dev`.

## Layout

```
app/(auth)        sign-in / sign-up
app/(dashboard)   home, counsellor pages, call, profile
app/api/voice     STT / LLM / TTS routes
convex/           schema, queries, auth, counsellor seed
voice-agent/      pipecat server (optional)
```

## License

[GPL-3.0](./LICENSE). See `LICENSE` for the full text.
