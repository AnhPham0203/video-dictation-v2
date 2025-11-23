// Google Cloud Text-to-Speech API endpoint with Timepoints
const textToSpeech = require("@google-cloud/text-to-speech");

const client = new textToSpeech.TextToSpeechClient();

/**
 * Splits text into sentences. A simple regex is used here.
 * For more robust sentence splitting, a more advanced NLP library would be needed.
 * @param {string} text The text to split.
 * @returns {string[]} An array of sentences.
 */
function splitSentences(text) {
  if (!text) return [];

  // Use Intl.Segmenter for robust sentence splitting if available (Node 16+)
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    const segments = segmenter.segment(text);
    const sentences = [];
    for (const { segment } of segments) {
      const trimmed = segment.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
    }
    return sentences;
  }

  // Fallback for older environments: Split by newlines and then simple regex
  const lines = text.split(/\r\n|\n|\r/);
  const allSentences = [];

  for (const line of lines) {
    const cleanedLine = line.trim();
    if (cleanedLine.length === 0) continue;
    
    // Match sentence ending punctuation . ! ?
    // This regex handles simple cases but Intl.Segmenter is preferred
    const matches = cleanedLine.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (matches && matches.length > 0) {
      matches.forEach(s => {
        const trimmed = s.trim();
        if (trimmed.length > 0) allSentences.push(trimmed);
      });
    } else {
      allSentences.push(cleanedLine);
    }
  }
  return allSentences;
}

module.exports = async (req, res) => {
  console.log("Google TTS API with Timepoints called with method:", req.method);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { text, language = "en-US" } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'text' parameter" });
  }

  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return res.status(400).json({
      error: "TTS_API_KEY_NOT_CONFIGURED",
      message: "Google Cloud API key is not configured.",
    });
  }

  const maxLength = 5000;
  if (text.length > maxLength) {
    return res.status(400).json({
      error: `Text is too long. Maximum length is ${maxLength} characters.`,
    });
  }

  try {
    const sentences = splitSentences(text);
    // We need to wrap the text in SSML and mark each sentence to get timepoints.
    const ssmlText = `<speak>${sentences
      .map((sentence, index) => `<mark name="${index}"/>${sentence}`)
      .join(" ")}</speak>`;

    console.log(`Generating audio for SSML (length: ${ssmlText.length})`);

    const request = {
      input: { ssml: ssmlText },
      voice: { languageCode: language, ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
      // Enable timepointing to get word/sentence boundaries
      enableTimepointing: ["SSML_MARK"],
    };

    const [response] = await client.synthesizeSpeech(request);

    const base64Audio = Buffer.from(response.audioContent).toString("base64");
    const audioDataUri = `data:audio/mpeg;base64,${base64Audio}`;

    // Process timepoints to create sentence objects with accurate start/end times
    // Gracefully handle cases where timepoints might not be returned
    const sentenceDetails = (response.timepoints || [])
      .map((point, index) => {
        const sentenceText = sentences[parseInt(point.markName, 10)];
        if (!sentenceText) return null;

        const startTime = parseFloat(point.timeSeconds);
        const nextPoint = response.timepoints[index + 1];
        // If there's a next point, its start time is our end time.
        // Otherwise, we need to get the full audio duration for the last sentence.
        const endTime = nextPoint ? parseFloat(nextPoint.timeSeconds) : null;

        return {
          text: sentenceText.trim(),
          start: startTime,
          end: endTime, // This will be null for the last sentence
        };
      })
      .filter(Boolean);

    // To get the end time for the last sentence, we need the total duration.
    // This requires another step, but for now, we can approximate or leave it open.
    // A simple way is to just add a fixed duration or let the player handle it.
    // For now, we'll let the frontend know the total duration.
    // To get the end time for the last sentence, we need the total duration.
    // This requires another step (e.g., using an audio library to get duration), 
    // so for now we leave it null and the client will play to the end.
    if (sentenceDetails.length > 0 && sentenceDetails[sentenceDetails.length - 1].end === null) {
      // This is expected for the last sentence.
    }

    // FALLBACK: If Google returns no timepoints (e.g., for very short text),
    // create a single sentence entry that covers the whole audio.
    if (sentenceDetails.length === 0 && sentences.length > 0) {
      console.log("No timepoints returned, creating a single fallback sentence.");
      sentenceDetails.push({
        text: sentences.join(" ").trim(),
        start: 0,
        end: null, // Play to the end
      });
    }


    console.log(`Successfully generated audio and ${(response.timepoints || []).length} timepoints.`);

    return res.status(200).json({
      success: true,
      audio: audioDataUri,
      sentences: sentenceDetails,
      format: "mp3",
      length: response.audioContent.length,
    });
  } catch (error) {
    console.error("Google TTS API error:", error);
    return res.status(500).json({
      error: "TTS_GENERATION_FAILED",
      message: error.message || "Failed to generate audio with Google TTS.",
      details: error,
    });
  }
};
