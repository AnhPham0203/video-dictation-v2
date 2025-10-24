const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

// Thiết lập ffmpeg
process.env.FFMPEG_PATH = ffmpegPath;

// Download yt-dlp binary nếu chưa tồn tại
const downloadYtDlp = async () => {
  const ytDlpPath = "/tmp/yt-dlp";
  
  // Nếu đã tồn tại, skip download
  if (fs.existsSync(ytDlpPath)) {
    fs.chmodSync(ytDlpPath, 0o755);
    return ytDlpPath;
  }

  console.log("Downloading yt-dlp binary...");
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(ytDlpPath);
    const url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
    
    https.get(url, { timeout: 30000 }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Xử lý redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on("finish", () => {
            file.close();
            fs.chmodSync(ytDlpPath, 0o755);
            console.log("yt-dlp downloaded successfully");
            resolve(ytDlpPath);
          });
        }).on("error", reject);
      } else {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          fs.chmodSync(ytDlpPath, 0o755);
          console.log("yt-dlp downloaded successfully");
          resolve(ytDlpPath);
        });
      }
    }).on("error", reject);
  });
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();

  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: "Missing videoId" });

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // Download yt-dlp binary nếu cần
    const ytDlpPath = await downloadYtDlp();
    const ytDlpWrap = new YTDlpWrap(ytDlpPath);

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
      return res.status(404).json({ error: "No English subtitles found." });
    }

    const srv3 = metadata.subtitles.en[0].data;
    const sentences = srv3.events.map((event) => {
      const clean = event.segs
        ?.map((seg) => seg.utf8.replace(/<[^>]*>/g, ""))
        .join(" ");
      return {
        text: clean?.trim() || "",
        start: event.tStartMs / 1000,
        duration: event.dDurationMs / 1000,
      };
    });

    return res.status(200).json({ sentences });
  } catch (error) {
    console.error("Error fetching captions:", error);
    return res.status(500).json({
      error: "An unexpected error occurred while fetching the transcript.",
      details: error.message,
    });
  }
};