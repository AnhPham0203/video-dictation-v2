from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from backend.utils.youtube_service import fetch_youtube_captions
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
