// Pronunciation Service with multiple API fallback strategy

interface PronunciationData {
  word: string;
  phonetics: Array<{
    text: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

// API Keys - Store in environment variables in production
const MERRIAM_WEBSTER_KEY = import.meta.env.VITE_MERRIAM_WEBSTER_KEY || "";
const WORDS_API_KEY = import.meta.env.VITE_WORDS_API_KEY || "";

/**
 * Fetch from Merriam-Webster Dictionary API (Primary)
 */
async function fetchFromMerriamWebster(
  word: string
): Promise<PronunciationData> {
  if (!MERRIAM_WEBSTER_KEY) {
    throw new Error("Merriam-Webster API key not configured");
  }

  const response = await fetch(
    `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${MERRIAM_WEBSTER_KEY}`
  );

  if (!response.ok) {
    throw new Error("Merriam-Webster API failed");
  }

  const data = await response.json();

  // Check if valid response (not suggestions)
  if (!Array.isArray(data) || typeof data[0] === "string") {
    throw new Error("Word not found");
  }

  const entry = data[0];

  // Format to our standard structure
  return {
    word: entry.meta?.id?.split(":")[0] || word,
    phonetics:
      entry.hwi?.prs?.map((pr: any) => ({
        text: pr.mw ? `/${pr.mw}/` : "",
        audio: pr.sound?.audio
          ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pr.sound.audio[0]}/${pr.sound.audio}.mp3`
          : undefined,
      })) || [],
    meanings: entry.def
      ? [
          {
            partOfSpeech: entry.fl || "unknown",
            definitions:
              entry.def[0]?.sseq
                ?.flat(2)
                .filter((item: any) => item[0] === "sense")
                .map((item: any) => ({
                  definition:
                    item[1]?.dt?.[0]?.[1]?.replace(/{.*?}/g, "") || "",
                  example:
                    item[1]?.dt?.find((d: any) => d[0] === "vis")?.[1]?.[0]
                      ?.t || undefined,
                }))
                .filter((def: any) => def.definition)
                .slice(0, 2) || [],
          },
        ]
      : [],
  };
}

/**
 * Fetch from WordsAPI (Secondary)
 */
async function fetchFromWordsAPI(word: string): Promise<PronunciationData> {
  if (!WORDS_API_KEY) {
    throw new Error("WordsAPI key not configured");
  }

  const response = await fetch(
    `https://wordsapiv1.p.rapidapi.com/words/${word}`,
    {
      headers: {
        "X-RapidAPI-Key": WORDS_API_KEY,
        "X-RapidAPI-Host": "wordsapiv1.p.rapidapi.com",
      },
    }
  );

  if (!response.ok) {
    throw new Error("WordsAPI failed");
  }

  const data = await response.json();

  return {
    word: data.word,
    phonetics: data.pronunciation
      ? [
          {
            text:
              typeof data.pronunciation === "string"
                ? `/${data.pronunciation}/`
                : `/${data.pronunciation.all || ""}/`,
            audio: undefined, // WordsAPI doesn't provide audio
          },
        ]
      : [],
    meanings:
      data.results?.slice(0, 2).map((result: any) => ({
        partOfSpeech: result.partOfSpeech || "unknown",
        definitions: [
          {
            definition: result.definition || "",
            example: result.examples?.[0] || undefined,
          },
        ],
      })) || [],
  };
}

/**
 * Fetch from Free Dictionary API (Tertiary fallback)
 */
async function fetchFromFreeDictionary(
  word: string
): Promise<PronunciationData> {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    { signal: AbortSignal.timeout(5000) } // 5s timeout
  );

  if (!response.ok) {
    throw new Error("Free Dictionary API failed");
  }

  const data = await response.json();
  return data[0];
}

/**
 * Cache layer using localStorage
 */
const CACHE_PREFIX = "pronunciation_cache_";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCachedData(word: string): PronunciationData | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + word);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
      localStorage.removeItem(CACHE_PREFIX + word);
    }
  } catch (error) {
    console.error("Cache read error:", error);
  }
  return null;
}

function setCachedData(word: string, data: PronunciationData): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + word,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

/**
 * Main function: Fetch with fallback strategy
 */
export async function fetchPronunciation(
  word: string
): Promise<PronunciationData> {
  const normalizedWord = word
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}]/g, "")
    .trim();

  if (!normalizedWord) {
    throw new Error("Invalid word");
  }

  // Check cache first
  const cached = getCachedData(normalizedWord);
  if (cached) {
    console.log("📦 Using cached data for:", normalizedWord);
    return cached;
  }

  // Try APIs in order with fallback
  const apis = [
    { name: "Merriam-Webster", fn: fetchFromMerriamWebster },
    { name: "WordsAPI", fn: fetchFromWordsAPI },
    { name: "Free Dictionary", fn: fetchFromFreeDictionary },
  ];

  let lastError: Error | null = null;

  for (const api of apis) {
    try {
      console.log(`🔍 Trying ${api.name} for:`, normalizedWord);
      const data = await api.fn(normalizedWord);

      // Cache successful result
      setCachedData(normalizedWord, data);
      console.log(`✅ ${api.name} succeeded`);

      return data;
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error);
      lastError = error instanceof Error ? error : new Error("Unknown error");
      // Continue to next API
    }
  }

  // All APIs failed
  throw lastError || new Error("All pronunciation APIs failed");
}

/**
 * Preload common words to cache
 */
export async function preloadCommonWords(words: string[]): Promise<void> {
  console.log("🚀 Preloading common words...");

  for (const word of words) {
    try {
      await fetchPronunciation(word);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.warn("Failed to preload:", word);
    }
  }

  console.log("✅ Preload complete");
}
