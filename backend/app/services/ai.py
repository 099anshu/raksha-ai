"""
services/ai.py
================
Single shared wrapper around Google's Gemini API — chosen because it has a
genuine ongoing free tier (no credit card, no expiring trial credits),
unlike most LLM APIs, and it natively supports both text and image input,
which is exactly what SENTINEL (text) and NETRA (vision) need.

Every RAKSHA AI module (SENTINEL, NETRA, KAVACH) calls into this file
instead of importing the Gemini SDK directly. That means:
  - only one place needs the API key
  - only one place needs error handling
  - it's easy to swap models later without touching route code

Get a free key (no credit card): https://aistudio.google.com/apikey
"""
import json
import time
from google import genai
from google.genai import types, errors
from app.config import settings

_client: genai.Client | None = None

# Google renames/retires model IDs every few months (e.g. gemini-2.5-flash was
# retired for new accounts in mid-2026), and different models carry very
# different free-tier daily quotas. We default to a flash-lite alias (higher
# free quota) and fall back through several others automatically — see
# _model_chain() below. Override via GEMINI_MODEL in .env if needed.
# Run backend/scripts/list_models.py any time to see what your key can use.
MODEL = settings.gemini_model


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Copy backend/.env.example to "
                "backend/.env and add your free key from https://aistudio.google.com/apikey"
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _model_chain() -> list[str]:
    """
    Primary model first, then fallbacks. gemini-flash-latest (currently
    gemini-3.5-flash) has a stingy free-tier quota — as low as 20
    requests/DAY as of writing — so flash-lite models (much cheaper to
    serve, much higher free quota) are tried first/alongside it.
    """
    chain = [MODEL]
    for fallback in ("gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"):
        if fallback not in chain:
            chain.append(fallback)
    return chain


def _generate_with_retry(contents, config, max_retries_per_model: int = 2):
    """
    Calls Gemini with automatic retry + model fallback.
      - 503 UNAVAILABLE (transient overload): retry the SAME model a couple
        times with backoff, then move on.
      - 429 RESOURCE_EXHAUSTED (daily/per-minute quota hit): retrying the
        same model won't help until the quota window resets, so we skip
        straight to the next model in the chain.
      - Other 4xx (bad request, invalid key): fail fast, no point retrying.
    """
    client = get_client()
    last_error: Exception | None = None
    for model_name in _model_chain():
        for attempt in range(max_retries_per_model):
            try:
                return client.models.generate_content(model=model_name, contents=contents, config=config)
            except errors.ServerError as e:
                last_error = e
                time.sleep(2 ** attempt)  # 1s, 2s — worth a couple of quick retries
                continue
            except errors.ClientError as e:
                last_error = e
                break  # 429 quota or other 4xx — move to the next model, don't waste time retrying
    raise RuntimeError(
        f"All Gemini models are currently unavailable after trying {_model_chain()}. "
        f"If this says RESOURCE_EXHAUSTED, you've hit the free-tier daily quota — wait "
        f"until tomorrow, or use a teammate's key. Last error: {last_error}"
    )


def ask_json(system_prompt: str, user_content, max_tokens: int = 1024) -> dict:
    """
    Calls Gemini and forces a JSON-only response, then parses it.
    Used by every module that needs a structured verdict
    (scam score, counterfeit verdict, etc).

    user_content can be:
      - a plain string, or
      - a list mixing strings and image dicts from image_content_block()
    """
    if isinstance(user_content, str):
        contents = [user_content]
    else:
        contents = user_content

    response = _generate_with_retry(
        contents,
        types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            max_output_tokens=max_tokens,
        ),
    )
    raw = (response.text or "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "model_did_not_return_valid_json", "raw": raw}


def ask_text(system_prompt: str, user_message: str, history: list | None = None, max_tokens: int = 600) -> str:
    """
    Plain conversational call — used by KAVACH chat.
    history is a list of {"role": "user"|"assistant", "content": "..."}
    """
    client = get_client()
    gemini_history = []
    for turn in history or []:
        role = "user" if turn["role"] == "user" else "model"
        gemini_history.append(types.Content(role=role, parts=[types.Part(text=turn["content"])]))

    config = types.GenerateContentConfig(system_instruction=system_prompt, max_output_tokens=max_tokens)
    last_error: Exception | None = None
    for model_name in _model_chain():
        for attempt in range(2):
            try:
                chat = client.chats.create(model=model_name, history=gemini_history, config=config)
                response = chat.send_message(user_message)
                return (response.text or "").strip()
            except errors.ServerError as e:
                last_error = e
                time.sleep(2 ** attempt)
                continue
            except errors.ClientError as e:
                last_error = e
                break  # quota/4xx on this model — try the next one in the chain
    raise RuntimeError(
        f"All Gemini models are currently unavailable after trying {_model_chain()}. "
        f"If this says RESOURCE_EXHAUSTED, you've hit the free-tier daily quota — wait "
        f"until tomorrow, or use a teammate's key. Last error: {last_error}"
    )


def image_content_block(image_bytes: bytes, media_type: str = "image/jpeg"):
    """Build a Gemini image part from raw image bytes."""
    return types.Part.from_bytes(data=image_bytes, mime_type=media_type)
