// Using youtubei.js - stable official YouTube library
const { Innertube } = require("youtubei.js");

module.exports = async (req, res) => {
  console.log("API called with method:", req.method);
  console.log("Query params:", req.query);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { videoId } = req.query;
  if (!videoId) {
    console.log("Missing videoId parameter");
    return res.status(400).json({ error: "Missing videoId" });
  }

  console.log("Fetching transcript for video:", videoId);

  try {
    // Create Innertube instance
    const youtube = await Innertube.create({
      cache: undefined, // Disable cache for serverless
    });

    // Get video info
    const info = await youtube.getInfo(videoId);

    // Get transcript data
    const transcriptData = await info.getTranscript();

    if (!transcriptData) {
      return res.status(404).json({
        error: "No subtitles found for this video.",
        videoId: videoId,
      });
    }

    // Extract segments with proper null checks
    const segments = transcriptData.transcript?.content?.body?.initial_segments;

    if (!segments || !Array.isArray(segments)) {
      return res.status(404).json({
        error: "No subtitle content available for this video.",
        videoId: videoId,
      });
    }

    // Map to frontend-compatible format
    const sentences = segments.map((segment) => ({
      text: (segment.snippet?.text || "").trim(),
      start: (segment.start_ms || 0) / 1000, // Convert ms to seconds
      duration: ((segment.end_ms || 0) - (segment.start_ms || 0)) / 1000, // Convert ms to seconds
    }));

    // Filter out empty texts
    const validSentences = sentences.filter((s) => s.text.length > 0);

    if (validSentences.length === 0) {
      return res.status(404).json({
        error: "No subtitle content available for this video.",
        videoId: videoId,
      });
    }

    console.log(
      `Successfully fetched ${validSentences.length} subtitle entries`
    );

    return res.status(200).json({
      success: true,
      sentences: validSentences,
      language: "en", // youtubei.js gets default language
      format: "json",
      count: validSentences.length,
      videoId: videoId,
    });
  } catch (error) {
    console.error("Error fetching transcript:", error);

    // Handle specific errors
    if (error.message && error.message.includes("Transcript is disabled")) {
      return res.status(404).json({
        error: "Subtitles are disabled for this video.",
        videoId: videoId,
      });
    }

    if (
      error.message &&
      (error.message.includes("not available") ||
        error.message.includes("unavailable"))
    ) {
      return res.status(404).json({
        error: "Video is unavailable or restricted.",
        videoId: videoId,
      });
    }

    if (error.message && error.message.includes("age-gated")) {
      return res.status(404).json({
        error: "Video is age-restricted and cannot be accessed.",
        videoId: videoId,
      });
    }

    return res.status(500).json({
      error: "An unexpected error occurred while fetching the transcript.",
      details: error.message,
    });
  }
};
