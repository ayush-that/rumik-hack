"""Rumik SILK TTS service for Pipecat (WebSocket streaming)."""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Optional

import aiohttp
import websockets
from loguru import logger

from pipecat.frames.frames import ErrorFrame, Frame, TTSAudioRawFrame
from pipecat.services.settings import TTSSettings
from pipecat.services.tts_service import TTSService
from pipecat.utils.tracing.service_decorators import traced_tts


@dataclass
class RumikTTSSettings(TTSSettings):
    """Settings for Rumik SILK."""

    model: str = "muga"                # "muga" or "mulberry"
    # muga only — one of: neutral, happy, sad, excited, angry, whisper
    tone: str = "neutral"
    description: Optional[str] = None  # mulberry only
    speaker: Optional[str] = None      # mulberry preset: speaker_1..speaker_4
    f0_up_key: int = 0                 # pitch shift in semitones, -12..12
    temperature: float = 0.6
    top_p: float = 0.95
    top_k: int = 50
    repetition_penalty: float = 1.2
    max_new_tokens: int = 2048


class RumikTTSService(TTSService):
    """Pipecat TTS using Rumik SILK streaming WebSocket.

    Flow per utterance:
      1. POST /v1/tts/ws-connect → {ws_url, token}
      2. WS connect ws_url?token=...
      3. send JSON synthesis frame
      4. receive raw PCM int16 24 kHz mono binary frames; yield them as
         TTSAudioRawFrame so the transport can stream audio out the moment
         SILK starts producing it.
      5. terminal text frame {"type":"done"} ends the utterance.
    """

    Settings = RumikTTSSettings
    _settings: Settings

    SAMPLE_RATE = 24000

    def __init__(
        self,
        *,
        api_key: str,
        aiohttp_session: aiohttp.ClientSession,
        base_url: str = "https://silk-api.rumik.ai",
        sample_rate: int | None = None,
        settings: Settings | None = None,
        **kwargs,
    ):
        default_settings = self.Settings()
        if settings is not None:
            default_settings.apply_update(settings)

        super().__init__(
            sample_rate=sample_rate or self.SAMPLE_RATE,
            push_start_frame=True,
            push_stop_frames=True,
            settings=default_settings,
            **kwargs,
        )

        self._api_key = api_key
        self._session = aiohttp_session
        self._base_url = base_url.rstrip("/")

    def can_generate_metrics(self) -> bool:
        return True

    @traced_tts
    async def run_tts(self, text: str, context_id: str) -> AsyncGenerator[Frame | None, None]:
        if not text.strip():
            return
        # Rumik caps text at 2000 chars
        text = text[:2000]

        # Muga is steered via a [tone] prefix; mulberry doesn't use tone tags.
        if self._settings.model == "muga" and not text.lstrip().startswith("["):
            text = f"[{self._settings.tone}] {text}"

        logger.debug(f"{self}: Rumik SILK TTS [{text!r}]")

        headers = {"Authorization": f"Bearer {self._api_key}"}
        mint_url = f"{self._base_url}/v1/tts/ws-connect"

        synthesis: dict = {
            "text": text,
            "temperature": self._settings.temperature,
            "top_p": self._settings.top_p,
            "top_k": self._settings.top_k,
            "repetition_penalty": self._settings.repetition_penalty,
            "max_new_tokens": self._settings.max_new_tokens,
        }
        if self._settings.model == "mulberry":
            if self._settings.description:
                synthesis["description"] = self._settings.description
            if self._settings.speaker:
                synthesis["speaker"] = self._settings.speaker
            if self._settings.f0_up_key:
                synthesis["f0_up_key"] = self._settings.f0_up_key

        # ws-connect needs model + text up-front; the same fields are echoed
        # back to the WS in the synthesis frame.
        mint_body: dict = {"model": self._settings.model, "text": text}

        try:
            await self.start_ttfb_metrics()

            async with self._session.post(mint_url, headers=headers, json=mint_body) as resp:
                if resp.status != 200:
                    err = await resp.text()
                    yield ErrorFrame(f"Rumik ws-connect HTTP {resp.status}: {err[:200]}")
                    return
                session = await resp.json()

            ws_url = session.get("ws_url")
            token = session.get("token")
            if not ws_url or not token:
                yield ErrorFrame(f"Rumik ws-connect malformed response: {session}")
                return

            await self.start_tts_usage_metrics(text)

            full_url = f"{ws_url}?token={token}"
            async with websockets.connect(full_url, max_size=None) as ws:
                await ws.send(json.dumps(synthesis))
                first = True
                async for msg in ws:
                    if isinstance(msg, (bytes, bytearray)):
                        if not msg:
                            continue
                        if first:
                            await self.stop_ttfb_metrics()
                            first = False
                        yield TTSAudioRawFrame(
                            audio=bytes(msg),
                            sample_rate=self.sample_rate,
                            num_channels=1,
                            context_id=context_id,
                        )
                    else:
                        # Text frame — terminal "done" or an error.
                        try:
                            data = json.loads(msg)
                        except json.JSONDecodeError:
                            continue
                        if data.get("type") == "done":
                            break
                        if data.get("error"):
                            yield ErrorFrame(f"Rumik SILK stream error: {data['error']}")
                            return

        except Exception as e:
            logger.exception("Rumik TTS error")
            yield ErrorFrame(f"Rumik SILK error: {e}")
