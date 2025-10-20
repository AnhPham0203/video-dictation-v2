from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import Optional

from backend.utils.youtube_service import fetch_youtube_captions
from backend.utils.translation_service import (
    TranslationServiceError,
    translate_text,
)

from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# Allow the frontend to call this API from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/captions")
async def get_captions(request: Request):
    data = await request.json()
    video_id = data.get("videoId")

    try:
        sentences = fetch_youtube_captions(video_id)
        print("Sentences length:", len(sentences))
        return {"sentences": sentences}
    except Exception as e:
        return {"error": str(e), "sentences": []}


class TranslationRequest(BaseModel):
    text: str
    target_language: str = "vi"
    source_language: Optional[str] = None


@app.post("/api/translate")
async def translate(request: TranslationRequest):
    try:
        translated = await translate_text(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language,
        )
        return {"translation": translated}
    except TranslationServiceError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Unexpected error while translating text.",
        ) from error


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
