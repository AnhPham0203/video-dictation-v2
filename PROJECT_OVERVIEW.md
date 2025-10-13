## Project Overview

### Backend
- FastAPI service in `backend/main.py` exposes `POST /api/captions`, adding permissive CORS for the frontend.
- `backend/utils/youtube_service.py` wraps `youtube_transcript_api` to fetch English/Vietnamese captions, normalizes fields (text, start, duration), and generates display-friendly timestamps while validating non-negative timing.

### Frontend Architecture
- React app bootstrapped with Vite and TypeScript, routed through `frontend/src/App.tsx` with the main experience at `pages/Index.tsx`.
- Shared UI primitives sourced from the local ShadCN-based `components/ui` directory and toast handling via `hooks/use-toast.ts`.

### Core Features
- **Video loading workflow** (`pages/Index.tsx`): parses YouTube URLs, calls the backend to retrieve captions, hydrates local sentence state, and toggles between learning modes (Dictation, Transcript, Typing). Tracks completion progress and supports mode switching between one or two sentences at a time.
- **Segment-aware playback** (`components/VideoPlayer.tsx`): embeds the YouTube IFrame API, seeks to the currently selected caption window, pauses automatically at the segment end, and offers a quick replay shortcut (holding Control).
- **Dictation practice** (`components/DictationPanel.tsx`): accepts user transcription input, sanitizes special symbols, compares word-by-word accuracy, highlights mistakes/omissions, and optionally shows a pronunciation overlay once the attempt is perfect.
- **Pronunciation helper** (`components/PronunciationWord.tsx`): fetches dictionary data for individual words (including phonetics and audio pronunciations) on demand and presents UK/US variants when available.
- **Typing trainer** (`components/TypingPanel.tsx`): focuses on copy-typing the active sentence(s) with live caret placement and per-character correctness coloring, invoking `onComplete` when the text matches exactly.
- **Transcript explorer** (`components/TranscriptView.tsx`): renders the full caption list with timestamps, highlights the active sentence, and allows clicking any sentence to seek that segment in the player.

### User Feedback and State
- Toast notifications surface loading success/failure states, leveraging the custom single-queue implementation in `hooks/use-toast.ts`.
- Progress tracking counts completed sentences and renders a `Progress` bar, while optional video covering hides the player to emphasize listening practice.
