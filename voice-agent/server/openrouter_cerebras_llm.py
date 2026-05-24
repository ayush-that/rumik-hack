"""OpenRouter LLM that forces a specific upstream provider via provider.order."""

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
