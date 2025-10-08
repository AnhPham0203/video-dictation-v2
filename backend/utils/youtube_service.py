from typing import Any, Dict

from youtube_transcript_api import YouTubeTranscriptApi


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


def fetch_youtube_captions(video_id: str):
    try:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=['en', 'vi'])
        normalized = [_to_dict(segment) for segment in transcript]
        return [_with_timestamp(segment) for segment in normalized]
    except Exception as e:
        raise Exception(f"Cannot fetch captions: {str(e)}")
    



