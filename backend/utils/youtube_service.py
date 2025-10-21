import os
from typing import Any, Dict, List

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig


def _to_dict(entry: Any) -> Dict[str, Any]:
    """
    Converts a transcript entry (which can be a dict or an object) 
    into a consistent dictionary format.
    """
    if isinstance(entry, dict):
        return {
            "text": entry.get("text", ""),
            "start": float(entry.get("start", 0.0)),
            "duration": float(entry.get("duration", 0.0)),
        }

    # Handle object-based entries from youtube_transcript_api
    return {
        "text": getattr(entry, "text", ""),
        "start": float(getattr(entry, "start", 0.0)),
        "duration": float(getattr(entry, "duration", 0.0)),
    }


def _with_timestamp(sentence: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a formatted timestamp to a sentence dictionary."""
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


def fetch_youtube_captions(video_id: str) -> List[Dict[str, Any]]:
    """
    Fetches YouTube captions for a given video ID using the youtube-transcript-api.
    This is the primary and only method used for fetching transcripts.
    """
    ENGLISH_LANGS = [
        "en", "en-GB", "en-US", "en-AU", "en-CA", "en-IN",
        "en-NZ", "en-IE", "en-ZA", "vi",
    ]

    try:
        # Check for proxy settings in environment variables
        http_proxy = os.getenv("HTTP_PROXY")
        https_proxy = os.getenv("HTTPS_PROXY")

        if http_proxy or https_proxy:
            proxy_config = GenericProxyConfig(
                http_url=http_proxy,
                https_url=https_proxy,
            )
            # Configure the proxies for the library to use.
            # The library will automatically pick up this configuration.
            YouTubeTranscriptApi(proxy_config=proxy_config)
        
        api = YouTubeTranscriptApi()

        # The get_transcript method is a static method on the class
        transcript = api.fetch(video_id, languages=ENGLISH_LANGS)
        
        normalized = [_to_dict(segment) for segment in transcript]
        return [_with_timestamp(segment) for segment in normalized]

    except Exception as error:
        # Re-raise a more specific exception to be handled by the API endpoint
        raise Exception(f"Cannot fetch captions for video ID {video_id}: {error}") from error
