const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const os = require("os");

// Khởi tạo YTDlpWrap một lần để tái sử dụng
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ytDlpPath = path.resolve(
  __dirname,
  "../../node_modules/yt-dlp-wrap/bin/yt-dlp"
);
const ytDlpWrap = new YTDlpWrap(ytDlpPath);
ytDlpWrap.setFFmpegPath(ffmpegPath);

module.exports = async (req, res) => {
  // Set CORS headers cho tất cả các phản hồi
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Xử lý request OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId query parameter" });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    console.log(`[API] Bắt đầu lấy phụ đề cho videoId: ${videoId}`);

    // Lấy phụ đề dạng JSON (.srv3)
    const metadata = await ytDlpWrap.getVideoInfo(videoUrl, [
      "--write-auto-subs",
      "--sub-lang",
      "en",
      "--sub-format",
      "srv3",
      "--skip-download",
    ]);

    // Kiểm tra xem phụ đề có tồn tại không
    if (
      !metadata.subtitles ||
      !metadata.subtitles.en ||
      metadata.subtitles.en.length === 0
    ) {
      console.log(`[API] Không tìm thấy phụ đề tiếng Anh cho: ${videoId}`);
      return res
        .status(404)
        .json({ error: "No English captions found for this video." });
    }

    // Lấy dữ liệu phụ đề từ metadata (đã được yt-dlp-wrap xử lý)
    const srv3Subtitles = metadata.subtitles.en[0].data;

    // Chuyển đổi định dạng srv3 sang định dạng mà frontend cần
    const sentences = srv3Subtitles.events.map((event) => {
      // Bỏ các thẻ XML/HTML khỏi text
      const cleanText = event.segs
        .map((seg) => seg.utf8.replace(/<[^>]*>/g, ""))
        .join(" ");
      return {
        text: cleanText.trim(),
        start: event.tStartMs / 1000, // Chuyển đổi ms sang giây
        duration: event.dDurationMs / 1000, // Chuyển đổi ms sang giây
      };
    });

    console.log(
      `[API] Xử lý thành công ${sentences.length} câu. Gửi phản hồi.`
    );
    return res.status(200).json({ sentences });
  } catch (error) {
    console.error(`[API] LỖI NGHIÊM TRỌNG khi lấy phụ đề cho ${videoId}:`, error);
    return res.status(500).json({
      error: "An unexpected error occurred while fetching the transcript.",
      details: error.message,
    });
  }
};
