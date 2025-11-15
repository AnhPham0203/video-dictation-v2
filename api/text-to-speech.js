// Google Cloud Text-to-Speech API endpoint
const textToSpeech = require("@google-cloud/text-to-speech");

// Creates a client
// Note: The client will automatically look for credentials via Application Default Credentials.
// For Vercel/local, set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// with the content of your service account JSON file.
// We check for GOOGLE_API_KEY just to ensure a key is present, but the library itself
// relies on the broader authentication setup.
const client = new textToSpeech.TextToSpeechClient();

module.exports = async (req, res) => {
  console.log("Google TTS API called with method:", req.method);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // The 'voice' parameter is ignored as it's specific to OpenAI.
  // Google's API uses languageCode to select an appropriate voice.
  const { text, language = "en-US" } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'text' parameter" });
  }

  // Check for Google Cloud API key (as a proxy for credentials)
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (!googleApiKey) {
    console.log("No GOOGLE_API_KEY found, returning fallback instructions");
    return res.status(200).json({
      success: false,
      error: "TTS_API_KEY_NOT_CONFIGURED",
      message:
        "Google Cloud API key is not configured. Please set GOOGLE_API_KEY environment variable.",
      fallback: {
        type: "web_speech_api",
        instructions:
          "You can use the browser's Web Speech API (SpeechSynthesis) as a free alternative.",
      },
    });
  }

  // Google TTS has a limit of 5000 bytes per request.
  // A character count is a rough proxy to prevent overly long requests.
  const maxLength = 5000;
  if (text.length > maxLength) {
    return res.status(400).json({
      error: `Text is too long. Maximum length is approximately ${maxLength} characters. Your text has ${text.length} characters.`,
    });
  }

  try {
    console.log(
      `Generating audio for text (length: ${text.length}, language: ${language})`
    );

    // Construct the request payload for Google TTS
    const request = {
      input: { text: text },
      // Select the language and a neutral voice gender
      voice: { languageCode: language, ssmlGender: "NEUTRAL" },
      // Select the audio encoding
      audioConfig: { audioEncoding: "MP3" },
    };

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // The response's audioContent is a base64-encoded string
    const audioContent = response.audioContent;
    const audioDataUri = `data:audio/mpeg;base64,${audioContent}`;
    const bufferLength = Buffer.from(audioContent, "base64").length;

    console.log(`Successfully generated audio (size: ${bufferLength} bytes)`);

    return res.status(200).json({
      success: true,
      audio: audioDataUri,
      format: "mp3",
      length: bufferLength,
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
