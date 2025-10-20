import os
from typing import Any, Dict, Iterable, List, Optional

import httpx
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig

YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3"


def _to_dict(entry: Any) -> Dict[str, Any]:
    if isinstance(entry, dict):
        return {
            "text": entry.get("text", ""),
            "start": float(entry.get("start", 0.0)),
            "duration": float(entry.get("duration", 0.0)),
        }

    return {
        "text": getattr(entry, "text", ""),
        "start": float(getattr(entry, "start", 0.0)),
        "duration": float(getattr(entry, "duration", 0.0)),
    }


def _with_timestamp(sentence: Dict[str, Any]) -> Dict[str, Any]:
    start = max(sentence["start"], 0.0)
    duration = max(sentence["duration"], 0.0)
    end = start + duration
    hours = int(start // 3600)
    minutes = int((start % 3600) // 60)
    seconds = int(start % 60)

    return {
        "text": sentence["text"],
        "start": start,
        "end": end,
        "duration": duration,
        "timestamp": f"{hours:02d}:{minutes:02d}:{seconds:02d}",
    }


def _language_matches(language: str, target: str) -> bool:
    if not language:
        return False
    language = language.lower()
    target = target.lower()
    if language == target:
        return True
    return language.split("-")[0] == target.split("-")[0]


def _select_caption_item(
    items: Iterable[Dict[str, Any]],
    languages: Iterable[str],
) -> Optional[Dict[str, Any]]:
    language_order = {language.lower(): index for index, language in enumerate(languages)}

    def score(item: Dict[str, Any]) -> float:
        snippet = item.get("snippet", {})
        language = (snippet.get("language") or "").lower()
        language_candidates = [
            language_order.get(language),
            language_order.get(language.split("-")[0]),
        ]
        language_indices = [value for value in language_candidates if value is not None]
        base = min(language_indices) if language_indices else len(language_order)
        penalty = 0.1 if snippet.get("trackKind", "").upper() == "ASR" else 0.0
        return (base if base is not None else len(language_order)) + penalty

    candidates = [item for item in items if item.get("id") and item.get("snippet")]
    if not candidates:
        return None

    prioritized = sorted(candidates, key=score)
    for item in prioritized:
        snippet = item.get("snippet", {})
        language = snippet.get("language")
        if any(_language_matches(language or "", candidate) for candidate in languages):
            return item
    return prioritized[0]


def _download_caption_track(
    client: httpx.Client,
    caption_id: str,
    api_key: str,
) -> List[Dict[str, Any]]:
    response = client.get(
        f"{YOUTUBE_API_BASE_URL}/captions/{caption_id}",
        params={"key": api_key, "tfmt": "json3"},
        timeout=15.0,
    )
    response.raise_for_status()

    data = response.json()
    events = data.get("events", [])
    sentences: List[Dict[str, Any]] = []

    for event in events:
        if not event:
            continue
        segments = event.get("segs", [])
        text = "".join(segment.get("utf8", "") for segment in segments if segment.get("utf8"))
        if not text.strip():
            continue

        start_ms = event.get("tStartMs")
        duration_ms = (
            event.get("dDurationMs")
            or event.get("tDurationMs")
            or event.get("wDurMs")
        )

        if start_ms is None:
            continue

        start = float(start_ms) / 1000.0
        duration = float(duration_ms) / 1000.0 if duration_ms is not None else 0.0

        sentences.append(
            {
                "text": text.strip(),
                "start": start,
                "duration": duration,
            }
        )

    if not sentences:
        raise ValueError("Caption track returned no readable cues.")

    return sentences


def _fetch_with_youtube_data_api(video_id: str, languages: List[str]) -> Optional[List[Dict[str, Any]]]:
    api_key = (
        os.getenv("YOUTUBE_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GOOGLE_TRANSLATE_API_KEY")
    )

    if not api_key:
        return None

    with httpx.Client() as client:
        response = client.get(
            f"{YOUTUBE_API_BASE_URL}/captions",
            params={
                "part": "snippet",
                "videoId": video_id,
                "key": api_key,
                "maxResults": 50,
            },
            timeout=15.0,
        )

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError:
            return None

        payload = response.json()
        caption_items = payload.get("items", [])
        if not caption_items:
            return None

        chosen_caption = _select_caption_item(caption_items, languages)
        if not chosen_caption:
            return None

        caption_id = chosen_caption.get("id")
        if not caption_id:
            return None

        try:
            return _download_caption_track(client, caption_id, api_key)
        except (httpx.HTTPError, ValueError):
            return None


def fetch_youtube_captions(video_id: str):
    ENGLISH_LANGS = [
        "en",
        "en-GB",
        "en-US",
        "en-AU",
        "en-CA",
        "en-IN",
        "en-NZ",
        "en-IE",
        "en-ZA",
        "vi",
    ]

    data_api_result = _fetch_with_youtube_data_api(video_id, ENGLISH_LANGS)
    if data_api_result:
        normalized = [_to_dict(segment) for segment in data_api_result]
        return [_with_timestamp(segment) for segment in normalized]

    try:
        # api = YouTubeTranscriptApi()
        http_proxy = os.getenv("HTTP_PROXY")
        https_proxy = os.getenv("HTTPS_PROXY")


        ytt_api = YouTubeTranscriptApi(
            proxy_config = GenericProxyConfig(
                http_url=http_proxy,
                https_url=https_proxy,
            )
        )
        transcript = ytt_api.fetch(video_id, languages=ENGLISH_LANGS)
    except Exception as error:
        raise Exception(f"Cannot fetch captions: {error}") from error

    normalized = [_to_dict(segment) for segment in transcript]
    return [_with_timestamp(segment) for segment in normalized]



