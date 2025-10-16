import html
import os
from typing import Optional

import httpx

GOOGLE_TRANSLATE_ENDPOINT = (
    "https://translation.googleapis.com/language/translate/v2"
)


class TranslationServiceError(Exception):
    """Raised when the Google Translation API call fails."""


def _get_api_key() -> str:
    api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    if not api_key:
        raise TranslationServiceError(
            "Google Translation API key is not configured. "
            "Set GOOGLE_TRANSLATE_API_KEY in the backend environment."
        )
    return api_key


async def translate_text(
    text: str,
    target_language: str,
    source_language: Optional[str] = None,
) -> str:
    """
    Translate a text string using Google Cloud Translation v2 API.

    Args:
        text: The source text to translate.
        target_language: Target language code (ISO 639-1), e.g. 'vi'.
        source_language: Optional source language code.

    Returns:
        The translated text.
    """
    stripped = text.strip()
    if not stripped:
        return ""

    api_key = _get_api_key()
    params = {
        "key": api_key,
        "q": stripped,
        "target": target_language,
        "format": "text",
    }
    if source_language:
        params["source"] = source_language

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(GOOGLE_TRANSLATE_ENDPOINT, params=params)

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        raise TranslationServiceError(
            f"Google Translation API responded with {error.response.status_code}: "
            f"{error.response.text}"
        ) from error

    payload = response.json()
    if "error" in payload:
        message = payload["error"].get("message", "Unknown error")
        raise TranslationServiceError(
            f"Google Translation API error: {message}"
        )

    translations = payload.get("data", {}).get("translations")
    if not translations:
        raise TranslationServiceError("No translation returned by the API.")

    translated_text = translations[0].get("translatedText", "")
    return html.unescape(translated_text)
