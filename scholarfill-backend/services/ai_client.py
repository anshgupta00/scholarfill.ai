"""
Unified AI client — routes calls to Groq or Gemini based on AI_PROVIDER in .env.

Developer sets in .env:
    AI_PROVIDER=groq       → uses GROQ_API_KEY, default model: llama-3.3-70b-versatile
    AI_PROVIDER=gemini     → uses GEMINI_API_KEY, default model: gemini-1.5-flash

Optional: AI_MODEL=<model_name> to override the default model.
"""
import json
import logging
from core.config import settings

logger = logging.getLogger(__name__)

# Default models per provider
PROVIDER_DEFAULTS = {
    "groq": "llama-3.3-70b-versatile",
    "gemini": "gemini-1.5-flash",
}

PROVIDER_FALLBACKS = {
    "groq": "llama-3.1-8b-instant",
    "gemini": "gemini-1.5-flash-8b",
}


def _get_model(provider: str, override: str | None = None) -> str:
    if override:
        return override
    if settings.AI_MODEL:
        return settings.AI_MODEL
    return PROVIDER_DEFAULTS.get(provider, "llama-3.3-70b-versatile")


def _get_fallback_model(provider: str) -> str:
    return PROVIDER_FALLBACKS.get(provider, "")


# ──────────────────────────────────────────────────────────────────────────────
# GROQ
# ──────────────────────────────────────────────────────────────────────────────
async def _call_groq(
    system_prompt: str,
    user_message: str,
    model: str,
    max_tokens: int = 2048,
    temperature: float = 0.1,
    json_mode: bool = True,
) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    kwargs = dict(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    completion = await client.chat.completions.create(**kwargs)
    return completion.choices[0].message.content.strip()


# ──────────────────────────────────────────────────────────────────────────────
# GEMINI
# ──────────────────────────────────────────────────────────────────────────────
async def _call_gemini(
    system_prompt: str,
    user_message: str,
    model: str,
    max_tokens: int = 2048,
    temperature: float = 0.1,
    json_mode: bool = True,
) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)

    generation_config = genai.GenerationConfig(
        max_output_tokens=max_tokens,
        temperature=temperature,
    )
    if json_mode:
        generation_config.response_mime_type = "application/json"

    gemini_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=system_prompt,
        generation_config=generation_config,
    )
    response = await gemini_model.generate_content_async(user_message)
    return response.text.strip()


# ──────────────────────────────────────────────────────────────────────────────
# PUBLIC INTERFACE
# ──────────────────────────────────────────────────────────────────────────────
async def ai_complete(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 2048,
    temperature: float = 0.1,
    json_mode: bool = True,
    model_override: str | None = None,
) -> str:
    """
    Send a prompt to the configured AI provider and return the raw text response.
    Automatically falls back to the secondary model on failure.
    """
    provider = settings.AI_PROVIDER.lower()
    primary_model = _get_model(provider, model_override)
    fallback_model = _get_fallback_model(provider)

    async def call(model: str) -> str:
        if provider == "gemini":
            return await _call_gemini(system_prompt, user_message, model, max_tokens, temperature, json_mode)
        else:
            return await _call_groq(system_prompt, user_message, model, max_tokens, temperature, json_mode)

    try:
        return await call(primary_model)
    except Exception as e:
        logger.warning(f"[AI] Primary model '{primary_model}' failed: {type(e).__name__}: {e}")
        if fallback_model and fallback_model != primary_model:
            try:
                logger.info(f"[AI] Retrying with fallback model '{fallback_model}'...")
                return await call(fallback_model)
            except Exception as fe:
                logger.error(f"[AI] Fallback model '{fallback_model}' also failed: {fe}")
        raise
