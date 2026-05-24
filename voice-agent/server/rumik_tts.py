"""Rumik SILK TTS service for Pipecat."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Optional

import aiohttp
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
    """Pipecat TTS using Rumik SILK REST endpoint.

    Returns 24 kHz mono PCM int16 (WAV header stripped).
    """

    Settings = RumikTTSSettings
    _settings: Settings

    SAMPLE_RATE = 24000
    WAV_HEADER_BYTES = 44

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

        url = f"{self._base_url}/v1/tts"
        headers = {"Authorization": f"Bearer {self._api_key}"}

        payload: dict = {
            "model": self._settings.model,
            "text": text,
            "temperature": self._settings.temperature,
            "top_p": self._settings.top_p,
            "top_k": self._settings.top_k,
            "repetition_penalty": self._settings.repetition_penalty,
            "max_new_tokens": self._settings.max_new_tokens,
        }
        if self._settings.model == "mulberry":
            if self._settings.description:
                payload["description"] = self._settings.description
            if self._settings.speaker:
                payload["speaker"] = self._settings.speaker
            if self._settings.f0_up_key:
                payload["f0_up_key"] = self._settings.f0_up_key

        try:
            await self.start_ttfb_metrics()

            async with self._session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    err = await response.text()
                    yield ErrorFrame(f"Rumik SILK HTTP {response.status}: {err[:200]}")
                    return

                await self.start_tts_usage_metrics(text)

                CHUNK_SIZE = self.chunk_size
                buffer = bytearray()
                header_stripped = False
                first = True

                async for chunk in response.content.iter_chunked(CHUNK_SIZE):
                    if not chunk:
                        continue
                    buffer.extend(chunk)

                    if not header_stripped:
                        if len(buffer) < self.WAV_HEADER_BYTES:
                            continue
                        # Drop the 44-byte WAV header
                        del buffer[: self.WAV_HEADER_BYTES]
                        header_stripped = True

                    if buffer:
                        if first:
                            await self.stop_ttfb_metrics()
                            first = False
                        yield TTSAudioRawFrame(
                            audio=bytes(buffer),
                            sample_rate=self.sample_rate,
                            num_channels=1,
                            context_id=context_id,
                        )
                        buffer.clear()

        except Exception as e:
            logger.exception("Rumik TTS error")
            yield ErrorFrame(f"Rumik SILK error: {e}")
