// Text-to-Speech Service
// Handles TTS API calls, sentence splitting, and localStorage management

const normalizeBaseUrl = (base?: string) => {
  if (!base) return "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

const buildApiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export interface TTSOptions {
  voice?: string;
  language?: string;
}

export interface SentenceTiming {
  text: string;
  start: number;
  end: number | null; // End can be null for the last sentence
}

export interface TTSResponse {
  success: boolean;
  audio?: string;
  sentences?: SentenceTiming[];
  format?: string;
  length?: number;
  error?: string;
  message?: string;
  fallback?: {
    type: string;
    instructions: string;
  };
}

export interface SavedText {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  lastModified: string;
}

const STORAGE_KEY = "customTexts";

/**
 * Generate audio from text using TTS API
 */
export async function generateAudio(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResponse> {
  try {
    const response = await fetch(buildApiUrl("/api/text-to-speech"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice: options.voice || "alloy",
        language: options.language || "en",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("TTS API error:", error);
    return {
      success: false,
      error: "TTS_API_ERROR",
      message: error instanceof Error ? error.message : "Failed to generate audio",
    };
  }
}

/**
 * Split text into sentences based on punctuation
 * Handles edge cases like Mr., Dr., etc.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  // Clean up text: normalize whitespace, remove extra newlines
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Abbreviations that shouldn't split sentences
  const abbreviations = [
    "Mr.",
    "Mrs.",
    "Ms.",
    "Dr.",
    "Prof.",
    "Sr.",
    "Jr.",
    "vs.",
    "e.g.",
    "i.e.",
    "etc.",
    "a.m.",
    "p.m.",
    "A.M.",
    "P.M.",
    "U.S.",
    "U.K.",
  ];

  // Create regex pattern to match abbreviations
  const abbrevPattern = abbreviations
    .map((abbr) => abbr.replace(/\./g, "\\."))
    .join("|");

  // Use Intl.Segmenter if available (best for modern browsers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segmenter = new (Intl as any).Segmenter("en", { granularity: "sentence" });
    const segments = segmenter.segment(cleaned);
    const sentences = [];
    for (const { segment } of segments) {
      const trimmed = segment.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
    }
    return sentences;
  }

  // Fallback: Split by newlines and punctuation
  const lines = cleaned.split(/\n+/);
  const allSentences: string[] = [];

  for (const line of lines) {
    const cleanedLine = line.trim();
    if (cleanedLine.length === 0) continue;

    const matches = cleanedLine.match(new RegExp(`(?<!${abbrevPattern})[^.!?]+[.!?]+|[^.!?]+$`, "g"));

    if (matches && matches.length > 0) {
      matches.forEach(s => {
        const trimmed = s.trim();
        if (trimmed.length > 0) {
          allSentences.push(trimmed);
        }
      });
    } else {
      allSentences.push(cleanedLine);
    }
  }

  return allSentences;
}

/**
 * Estimate duration for a sentence based on text length
 * Average speaking rate is ~150 words per minute
 */
export function estimateSentenceDuration(text: string): number {
  if (!text) return 0;
  
  // Count words (split by whitespace)
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  
  // Average: 150 words/minute = 2.5 words/second
  // Add some padding for pauses
  const baseDuration = wordCount / 2.5;
  const padding = Math.min(wordCount * 0.2, 2); // Max 2 seconds padding
  
  return baseDuration + padding;
}

/**
 * Create sentence objects with timestamps from text (for preview or fallback)
 * Format compatible with YouTube transcript structure
 */
export function createSentencesFromText(text: string): Array<{
  text: string;
  translation?: string;
  timestamp: string;
  start: number;
  end: number;
}> {
  const sentenceTexts = splitIntoSentences(text);
  const sentences: Array<{
    text: string;
    translation?: string;
    timestamp: string;
    start: number;
    end: number;
  }> = [];

  let currentTime = 0;

  sentenceTexts.forEach((sentenceText) => {
    const duration = estimateSentenceDuration(sentenceText);
    const start = currentTime;
    const end = currentTime + duration;

    // Format timestamp as MM:SS
    const formatTimestamp = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    sentences.push({
      text: sentenceText,
      timestamp: formatTimestamp(start),
      start,
      end,
    });

    currentTime = end;
  });

  return sentences;
}

/**
 * Save text to localStorage
 */
export function saveTextToStorage(
  text: string,
  title: string,
  id?: string
): SavedText {
  const savedTexts = getSavedTexts();
  const now = new Date().toISOString();
  
  const newText: SavedText = {
    id: id || crypto.randomUUID(),
    title: title || `Untitled ${new Date().toLocaleDateString()}`,
    text,
    createdAt: id ? savedTexts.find((t) => t.id === id)?.createdAt || now : now,
    lastModified: now,
  };

  // If updating existing, remove old entry
  if (id) {
    const index = savedTexts.findIndex((t) => t.id === id);
    if (index !== -1) {
      savedTexts[index] = newText;
    } else {
      savedTexts.push(newText);
    }
  } else {
    savedTexts.push(newText);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTexts));
  return newText;
}

/**
 * Load text from localStorage by ID
 */
export function loadTextFromStorage(id: string): SavedText | null {
  const savedTexts = getSavedTexts();
  return savedTexts.find((t) => t.id === id) || null;
}

/**
 * Get all saved texts from localStorage
 */
export function getSavedTexts(): SavedText[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    return parsed.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  } catch (error) {
    console.error("Error loading saved texts:", error);
    return [];
  }
}

/**
 * Delete text from localStorage by ID
 */
export function deleteTextFromStorage(id: string): boolean {
  try {
    const savedTexts = getSavedTexts();
    const filtered = savedTexts.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered.length < savedTexts.length;
  } catch (error) {
    console.error("Error deleting saved text:", error);
    return false;
  }
}

/**
 * Use Web Speech API as fallback (client-side only)
 */
export function generateAudioWithWebSpeechAPI(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Web Speech API is not supported in this browser"));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop Web Speech API playback
 */
export function stopWebSpeechAPI(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
