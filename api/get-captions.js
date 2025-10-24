const { YoutubeTranscript } = require("youtube-transcript");

module.exports = async (req, res) => {
  console.log("--- [API] Function invoked ---");

  const { videoId } = req.query;
  console.log(`--- [API] Received videoId: ${videoId} ---`);

  if (!videoId) {
    console.log("--- [API] Error: Missing videoId ---");
    return res.status(400).json({ error: "Missing videoId query parameter" });
  }

  // Set CORS headers to allow requests from any origin for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.removeHeader?.("ETag");
  res.removeHeader?.("Last-Modified");

  // Handle preflight OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    console.log("--- [API] Handling OPTIONS preflight request ---");
    return res.status(200).end();
  }

  try {
    console.log("--- [API] Attempting to fetch transcript... ---");
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });
    console.log("--- [API] Transcript fetched successfully ---");

    if (!transcript || transcript.length === 0) {
      console.log("--- [API] Warning: No transcript content found ---");
      return res
        .status(404)
        .json({ error: "No English captions found for this video." });
    }

    const sentences = transcript.map((item) => ({
      text: item.text,
      start: item.offset / 1000, // Convert milliseconds to seconds
      duration: item.duration / 1000, // Convert milliseconds to seconds
    }));

    console.log(
      `--- [API] Processed ${sentences.length} sentences. Sending response. ---`
    );
    return res.status(200).json({ sentences });
  } catch (error) {
    console.error("--- [API] CRITICAL ERROR ---");
    console.error(error); // Log the full error object

    let errorMessage =
      "An unexpected error occurred while fetching the transcript.";
    if (
      error.message &&
      error.message.includes("Could not find transcript for video")
    ) {
      errorMessage =
        "No English captions found for this video. They may be disabled or auto-generated.";
    }

    return res
      .status(500)
      .json({ error: errorMessage, details: error.message });
  }
};
