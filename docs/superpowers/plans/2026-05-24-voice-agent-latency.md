# Voice Agent Latency Reduction Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut end-to-end latency between "user stops speaking" and "bot first audio plays" by swapping every non-Rumik model in the pipeline for a faster one and tightening turn-taking.

**Architecture:** Same Pipecat cascade (STT → LLM → TTS) — swap STT to **Deepgram Flux** (conversational STT, ~150ms TTFT), swap LLM to **OpenRouter `z-ai/glm-4.7` forced onto Cerebras provider** (~sub-100ms TTFT, ~2000 tok/s), tighten Silero VAD `stop_secs` to **0.4s** for snappier turn detection. Rumik SILK muga WS streaming stays.

**Tech Stack:** Pipecat 1.2.1, Deepgram Flux (`pipecat.services.deepgram.flux.DeepgramFluxSTTService`), OpenRouter via `pipecat.services.openrouter.llm.OpenRouterLLMService` subclassed to inject `extra_body={"provider": {"order": ["Cerebras"]}}`, `SileroVADAnalyzer` with custom `VADParams`.

---

## File Structure

- `voice-agent/server/.env` — add `OPENROUTER_API_KEY`, swap `GOOGLE_MODEL` for `OPENROUTER_MODEL`
- `voice-agent/server/openrouter_cerebras_llm.py` — **NEW** thin subclass of `OpenRouterLLMService` that forces the Cerebras provider via OpenRouter's `provider.order` extra body field
- `voice-agent/server/bot.py` — swap `DeepgramSTTService` → `DeepgramFluxSTTService`, swap `GoogleLLMService` → our `OpenRouterCerebrasLLMService`, pass `VADParams(stop_secs=0.4)` into `SileroVADAnalyzer`
- `.env.local` (root) — confirm `OPENROUTER_API_KEY` is present (it already is from earlier setup)

No frontend changes. No schema changes.

---

## Tasks

### Task 1: Add OPENROUTER_API_KEY + model to bot .env

**Files:**
- Modify: `voice-agent/server/.env`

- [ ] **Step 1: Append OpenRouter config**

Open `voice-agent/server/.env`. Below the existing `GOOGLE_API_KEY` block, append:

```
# OpenRouter (LLM gateway → Cerebras provider for sub-100ms TTFT)
OPENROUTER_API_KEY=<redacted — copy from root .env.local>
OPENROUTER_MODEL=z-ai/glm-4.7
OPENROUTER_PROVIDER=Cerebras
```

(The OPENROUTER_API_KEY value is already in the root `.env.local` from the earlier hackathon setup; we duplicate it into the bot's env file because the bot loads from its own `.env`.)

- [ ] **Step 2: Verify**

Run: `grep OPENROUTER voice-agent/server/.env`
Expected: three lines for `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_PROVIDER`.

- [ ] **Step 3: Smoke test OpenRouter → Cerebras directly with curl**

```bash
curl -sS -w "\nHTTP %{http_code} in %{time_total}s\n" \
  -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $(grep ^OPENROUTER_API_KEY voice-agent/server/.env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "z-ai/glm-4.7",
    "provider": {"order": ["Cerebras"]},
    "messages": [{"role":"user","content":"Say hello in 5 words."}],
    "max_tokens": 32
  }' | tail -10
```
Expected: HTTP 200, total time well under 1 second, body containing a `choices[0].message.content` string. If you get HTTP 4xx with "no providers available" or similar, fall back to `"order": ["Cerebras", "Groq", "Fireworks"]` to let OpenRouter auto-pick — record the deviation in your commit message and tell the controller.

No commit yet — this task is config only and gets bundled with Task 5's bot.py edit.

---

### Task 2: Custom OpenRouter LLM service that forces a provider

**Files:**
- Create: `voice-agent/server/openrouter_cerebras_llm.py`

- [ ] **Step 1: Write the subclass**

```python
"""OpenRouter LLM that forces a specific upstream provider.

OpenRouter accepts a top-level `provider.order` array on chat-completions
requests to bias / restrict which underlying inference provider serves the
call. We use this to force Cerebras (sub-100ms TTFT at ~2000 tok/s) for the
voice-agent path.

The base ``OpenRouterLLMService`` builds the chat-completion params dict via
``build_chat_completion_params`` and then hands it to the OpenAI SDK. We
override that one method and merge an ``extra_body`` field, which the OpenAI
SDK forwards verbatim as part of the JSON body.
"""

from __future__ import annotations

from typing import Any, Sequence

from pipecat.adapters.services.open_ai_adapter import OpenAILLMInvocationParams
from pipecat.services.openrouter.llm import OpenRouterLLMService


class OpenRouterCerebrasLLMService(OpenRouterLLMService):
    """OpenRouterLLMService that injects ``provider.order = providers``."""

    def __init__(self, *, providers: Sequence[str] = ("Cerebras",), **kwargs):
        super().__init__(**kwargs)
        self._providers = list(providers)

    def build_chat_completion_params(
        self, params_from_context: OpenAILLMInvocationParams
    ) -> dict[str, Any]:
        params = super().build_chat_completion_params(params_from_context)
        extra = dict(params.get("extra_body") or {})
        extra["provider"] = {"order": self._providers}
        params["extra_body"] = extra
        return params
```

- [ ] **Step 2: Smoke import**

Run:
```bash
cd voice-agent/server && uv run python -c "from openrouter_cerebras_llm import OpenRouterCerebrasLLMService; print('ok')"
```
Expected: `ok` printed (after the pipecat banner).

No commit yet — bundled with Task 5.

---

### Task 3: Switch VAD `stop_secs` to 0.4

**Files:**
- Modify: `voice-agent/server/bot.py`

- [ ] **Step 1: Add VADParams import**

Open `bot.py`. Find the existing `from pipecat.audio.vad.silero import SileroVADAnalyzer` line and add the import for `VADParams`:

```python
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
```

- [ ] **Step 2: Pass tightened params to the analyzer**

Find the existing aggregator construction:

```python
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),    ),
    )
```

Replace with:

```python
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.4)),
        ),
    )
```

No commit yet — bundled with Task 5.

---

### Task 4: Switch STT to Deepgram Flux

**Files:**
- Modify: `voice-agent/server/bot.py`

- [ ] **Step 1: Swap the import**

In `bot.py`, replace:

```python
from pipecat.services.deepgram.stt import DeepgramSTTService
```

with:

```python
from pipecat.services.deepgram.flux.stt import DeepgramFluxSTTService
```

- [ ] **Step 2: Swap the instantiation**

Find:

```python
    # Speech-to-Text service
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
```

Replace with:

```python
    # Speech-to-Text service — Deepgram Flux, designed for low-latency
    # conversational voice agents. flux-general-en is the default.
    stt = DeepgramFluxSTTService(
        api_key=os.getenv("DEEPGRAM_API_KEY"),
        settings=DeepgramFluxSTTService.Settings(
            model="flux-general-en",
        ),
    )
```

No commit yet — bundled with Task 5.

---

### Task 5: Switch LLM to OpenRouter → Cerebras + commit everything

**Files:**
- Modify: `voice-agent/server/bot.py`

- [ ] **Step 1: Swap the import**

In `bot.py`, replace:

```python
from pipecat.services.google.llm import GoogleLLMService
```

with:

```python
from openrouter_cerebras_llm import OpenRouterCerebrasLLMService
```

- [ ] **Step 2: Swap the LLM instantiation**

Find:

```python
    # LLM service
    llm = GoogleLLMService(
        api_key=os.getenv("GOOGLE_API_KEY"),
        settings=GoogleLLMService.Settings(
            model=os.getenv("GOOGLE_MODEL", "gemini-flash-latest"),
            system_instruction=build_system_prompt(counsellor),
        ),
    )
```

Replace with:

```python
    # LLM service — OpenRouter routes to Cerebras for sub-100ms TTFT.
    # OpenRouter is OpenAI-compatible: system prompt goes in the message
    # context as a "system" message (NOT as a settings field like Gemini).
    llm = OpenRouterCerebrasLLMService(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        providers=[p.strip() for p in os.getenv("OPENROUTER_PROVIDER", "Cerebras").split(",") if p.strip()],
        settings=OpenRouterCerebrasLLMService.Settings(
            model=os.getenv("OPENROUTER_MODEL", "z-ai/glm-4.7"),
        ),
    )
```

- [ ] **Step 3: Move the system prompt into the LLMContext**

Find the existing `context = LLMContext()` line, and immediately after it prepend a system message. Replace:

```python
    context = LLMContext()
```

With:

```python
    context = LLMContext()
    context.add_message({"role": "system", "content": build_system_prompt(counsellor)})
```

(The prior Gemini path set the system prompt via `settings.system_instruction`. OpenAI-compatible providers expect a system message as the first item in the messages array, which the LLMContext aggregator will forward verbatim.)

- [ ] **Step 4: Verify bot still imports**

```bash
cd voice-agent/server && uv run python -c "import bot; print('ok')"
```
Expected: `ok` printed (after pipecat banner; no traceback).

- [ ] **Step 5: Start bot, confirm it binds 7860**

```bash
# Kill any running bot
pkill -9 -f "bot.py" 2>/dev/null; sleep 1
cd voice-agent/server && uv run bot.py > /tmp/bot.log 2>&1 &
sleep 5
lsof -ti:7860 && echo "OK 7860 listening" || (echo "FAIL"; tail -30 /tmp/bot.log)
```
Expected: `OK 7860 listening`. If FAIL, the tailed log shows the crash — fix it before continuing.

- [ ] **Step 6: Stage and commit everything from tasks 1-5 together**

```bash
git add voice-agent/server/.env voice-agent/server/openrouter_cerebras_llm.py voice-agent/server/bot.py
git commit -m "perf: switch STT to deepgram flux, LLM to openrouter/cerebras z-ai/glm-4.7, tighten VAD to 0.4s"
```

(`.env` is `.gitignore`d at the root via `.env*` — verify with `git check-ignore -v voice-agent/server/.env` BEFORE staging. If it's NOT ignored, do NOT add it to the commit — the file contains real keys. Instead update only `.env.example` with the new variable names and tell the user to update their local `.env`.)

---

### Task 6: End-to-end browser test + perceived-latency check

**Files:** none — verification only.

- [ ] **Step 1: Restart the full stack**

In the user's main terminal:
1. `Ctrl-C` whatever `pnpm dev` is running.
2. `pkill -9 -f "bot.py"` to clear any stray bots the controller may have started.
3. `pnpm dev` — wait for all three (next, convex, voice) to print ready.

- [ ] **Step 2: Browser smoke test**

In your real browser (Chrome):
1. Navigate to `http://localhost:3000/dashboard`.
2. Click `Call` on any counsellor (Devrajit is a good test — long-ish system prompt).
3. Allow mic.
4. Time from the green "Live" indicator appearing to the FIRST audible word from the bot. Note it.
5. Speak a short question ("can you tell me about my career?"). Time from when you stop speaking to first audible word back. Note it.

- [ ] **Step 3: Tail the bot log for sanity**

In a second terminal: `tail -f /tmp/bot.log | grep -E "Flux|OpenRouter|TTFB|Rumik|ttft|Cerebras"`

Look for:
- A line mentioning `DeepgramFluxSTTService` is doing the STT (not `DeepgramSTTService`).
- A line from `OpenRouterCerebrasLLMService` or `OpenRouter` (not `GoogleLLMService`).
- `RumikTTSService` TTFB metrics — note the values for before/after comparison.

- [ ] **Step 4: If something regressed, roll back tactically**

If LLM TTFT is HIGHER than before (Cerebras was unreachable / cold), fall back by changing `OPENROUTER_PROVIDER=Cerebras,Groq,Fireworks` in `.env` and restarting the bot — OpenRouter will auto-pick the first available provider. Commit that change.

If STT misses words noticeably, swap `model="flux-general-en"` for `"flux-general-multi"` (more accurate, slightly slower) or revert to `DeepgramSTTService` with `nova-3` for that single line and commit the revert.

If user gets cut off mid-sentence with `stop_secs=0.4`, bump it to `0.5` or `0.6` and recommit.

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Out of Scope (separate plans)

- Token-level streaming from LLM to TTS at sub-sentence granularity (pipecat's `TTSService` already does sentence-level aggregation — finer-grained streaming requires custom processor work, not worth the complexity for this hackathon).
- Pre-warming Cerebras (cold-start mitigation) — not exposed by OpenRouter.
- Switching Silero VAD for a smaller/faster VAD (e.g. WebRTC VAD) — Silero is already very fast and quality matters more than the tiny saving.
- Per-counsellor voice/tone tuning on Rumik — user explicitly scoped Rumik out of this plan.
