const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");
const https = require("https");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

process.env.FFMPEG_PATH = ffmpegPath;

const downloadYtDlp = async () => {
  const ytDlpPath = "/tmp/yt-dlp";
  
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
    const ytDlpPath = await downloadYtDlp();
    const ytDlpWrap = new YTDlpWrap(ytDlpPath);

    const metadata = await ytDlpWrap.getVideoInfo(videoUrl, [
      "--write-auto-subs",
      "--sub-lang",
      "en,vi,ja,ko,pt,es,fr",
      "--sub-format",
      "srv3/vtt/srt",
      "--skip-download",
    ]);

    console.log("Available subtitles:", Object.keys(metadata.subtitles || {}));

    // Kiểm tra các ngôn ngữ khả dụng
    if (!metadata.subtitles || Object.keys(metadata.subtitles).length === 0) {
      return res.status(404).json({
        error: "No subtitles found for this video.",
        videoId,
      });
    }

    // Ưu tiên: en > vi > bất kỳ ngôn ngữ nào khác
    let subtitleData = null;
    let lang = null;

    for (const language of ["en", "vi", "ja", "ko", "pt", "es", "fr"]) {
      if (metadata.subtitles[language]) {
        lang = language;
        // Thử srv3 trước, nếu không có thì thử vtt
        const srv3Sub = metadata.subtitles[language].find(
          (sub) => sub.ext === "srv3"
        );
        const vttSub = metadata.subtitles[language].find(
          (sub) => sub.ext === "vtt"
        );
        const srtSub = metadata.subtitles[language].find(
          (sub) => sub.ext === "srt"
        );

        subtitleData = srv3Sub || vttSub || srtSub;
        if (subtitleData) break;
      }
    }

    if (!subtitleData) {
      return res.status(404).json({
        error: "No subtitles in supported formats found.",
        availableLanguages: Object.keys(metadata.subtitles),
      });
    }

    console.log(`Using ${lang} subtitles in ${subtitleData.ext} format`);

    let sentences = [];

    // Xử lý srv3 format
    if (subtitleData.ext === "srv3" && subtitleData.data) {
      const srv3 = subtitleData.data;
      sentences = srv3.events.map((event) => {
        const clean = event.segs
          ?.map((seg) => seg.utf8.replace(/<[^>]*>/g, ""))
          .join(" ");
        return {
          text: clean?.trim() || "",
          start: event.tStartMs / 1000,
          duration: event.dDurationMs / 1000,
        };
      });
    }
    // Xử lý VTT format
    else if (subtitleData.ext === "vtt" && subtitleData.data) {
      const vttContent = subtitleData.data;
      const lines = vttContent.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("-->")) {
          const timeParts = lines[i].split(" --> ");
          const text = lines[i + 1];
          if (text && timeParts.length === 2) {
            sentences.push({
              text: text.trim(),
              start: parseFloat(timeParts[0].replace(/:/g, ".").split(".")[0]) * 3600 +
                     parseFloat(timeParts[0].replace(/:/g, ".").split(".")[1]) * 60 +
                     parseFloat(timeParts[0].replace(/:/g, ".").split(".")[2]),
              duration: 0,
            });
          }
        }
      }
    }

    if (sentences.length === 0) {
      return res.status(404).json({
        error: "No subtitle content found.",
        lang,
        format: subtitleData.ext,
      });
    }

    return res.status(200).json({
      sentences,
      language: lang,
      format: subtitleData.ext,
      count: sentences.length,
    });
  } catch (error) {
    console.error("Error fetching captions:", error);
    return res.status(500).json({
      error: "An unexpected error occurred while fetching the transcript.",
      details: error.message,
    });
  }
};