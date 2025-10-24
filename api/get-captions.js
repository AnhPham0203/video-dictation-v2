const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");

// Import ffmpeg-static để có đường dẫn ffmpeg hợp lệ
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

// Thiết lập ffmpeg path qua biến môi trường (đây là cách đúng)
process.env.FFMPEG_PATH = ffmpegPath;

// Khởi tạo yt-dlp binary path
const ytDlpPath = path.resolve(
  __dirname,
  "../../node_modules/yt-dlp-wrap/bin/yt-dlp"
);
const ytDlpWrap = new YTDlpWrap(ytDlpPath);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId query parameter" });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    console.log(`[API] Fetching subtitles for: ${videoId}`);

    // Lấy metadata của video
    const metadata = await ytDlpWrap.getVideoInfo(videoUrl, [
      "--write-auto-subs",
      "--sub-lang",
      "en",
      "--sub-format",
      "srv3",
      "--skip-download",
    ]);

    if (
      !metadata.subtitles ||
      !metadata.subtitles.en ||
      metadata.subtitles.en.length === 0
    ) {
      console.log(`[API] No English captions found for: ${videoId}`);
      return res
        .status(404)
        .json({ error: "No English captions found for this video." });
    }

    // Lấy dữ liệu phụ đề
    const srv3Subtitles = metadata.subtitles.en[0].data;

    // Convert srv3 → text
    const sentences = srv3Subtitles.events.map((event) => {
      const cleanText = event.segs
        ?.map((seg) => seg.utf8.replace(/<[^>]*>/g, ""))
        .join(" ");
      return {
        text: cleanText?.trim() || "",
        start: event.tStartMs / 1000,
        duration: event.dDurationMs / 1000,
      };
    });

    console.log(`[API] Successfully processed ${sentences.length} sentences.`);
    return res.status(200).json({ sentences });
  } catch (error) {
    console.error(`[API] Error while fetching subtitles:`, error);
    return res.status(500).json({
      error: "An unexpected error occurred while fetching the transcript.",
      details: error.message,
    });
  }
};
