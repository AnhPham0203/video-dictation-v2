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

const parseSubtitleFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  
  try {
    // Thử parse JSON (srv3 hoặc json3)
    const json = JSON.parse(content);
    if (json.events) {
      return json.events.map((event) => {
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
  } catch (e) {
    // Không phải JSON, thử parse VTT
    if (content.includes("WEBVTT")) {
      const lines = content.split("\n");
      const sentences = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("-->")) {
          const timeParts = lines[i].split(" --> ");
          const text = lines[i + 1]?.trim();
          if (text && timeParts.length === 2) {
            const timeToSeconds = (timeStr) => {
              const parts = timeStr.trim().split(":");
              return (
                parseInt(parts[0]) * 3600 +
                parseInt(parts[1]) * 60 +
                parseFloat(parts[2])
              );
            };
            sentences.push({
              text,
              start: timeToSeconds(timeParts[0]),
              duration: timeToSeconds(timeParts[1]) - timeToSeconds(timeParts[0]),
            });
          }
        }
      }
      return sentences.length > 0 ? sentences : null;
    }
    
    // Thử parse SRT
    const blocks = content.split(/\n\n+/);
    const sentences = [];
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      if (lines.length >= 3) {
        const timeLine = lines[1];
        const text = lines.slice(2).join("\n");
        const timeParts = timeLine.split(" --> ");
        if (timeParts.length === 2) {
          const timeToSeconds = (timeStr) => {
            const parts = timeStr.trim().split(":");
            return (
              parseInt(parts[0]) * 3600 +
              parseInt(parts[1]) * 60 +
              parseFloat(parts[2].replace(",", "."))
            );
          };
          sentences.push({
            text: text.trim(),
            start: timeToSeconds(timeParts[0]),
            duration: timeToSeconds(timeParts[1]) - timeToSeconds(timeParts[0]),
          });
        }
      }
    }
    return sentences.length > 0 ? sentences : null;
  }

  return null;
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
    const outputDir = "/tmp";
    const outputTemplate = path.join(outputDir, "%(id)s.%(ext)s");

    // ✅ BƯỚC 1: Chạy thực tế để tải phụ đề (không chỉ metadata)
    console.log("Downloading subtitles for:", videoId);
    await ytDlpWrap.execPromise([
      videoUrl,
      "--write-subs",
      "--write-auto-subs",
      "--skip-download",
      "--sub-lang",
      "en,en-US,en-GB,vi,ja,ko,zh-Hans,zh-Hant,es,pt,fr",
      "--sub-format",
      "srv3/vtt/srt/json3",
      "-o",
      outputTemplate,
    ]);

    // ✅ BƯỚC 2: Lấy metadata để biết video ID chính xác
    const metadata = await ytDlpWrap.getVideoInfo(videoUrl);
    const actualVideoId = metadata.id || videoId;
    
    console.log("Available subtitle languages:", Object.keys(metadata.subtitles || {}));

    if (!metadata.subtitles || Object.keys(metadata.subtitles).length === 0) {
      return res.status(404).json({
        error: "No subtitles found for this video.",
        videoId: actualVideoId,
      });
    }

    // ✅ BƯỚC 3: Ưu tiên ngôn ngữ: en > vi > bất kỳ ngôn ngữ nào
    let selectedSentences = null;
    let selectedLang = null;
    let selectedFormat = null;

    for (const lang of ["en", "vi", "ja", "ko", "zh-Hans", "zh-Hant", "es", "pt", "fr"]) {
      if (metadata.subtitles[lang]) {
        selectedLang = lang;
        console.log(`Found subtitles in language: ${lang}`);

        // Thử các format theo thứ tự ưu tiên
        for (const format of ["srv3", "vtt", "srt", "json3"]) {
          const subtitleInfo = metadata.subtitles[lang].find((s) => s.ext === format);
          if (subtitleInfo) {
            selectedFormat = format;
            const filePath = path.join(outputDir, `${actualVideoId}.${lang}.${format}`);
            console.log(`Trying to read: ${filePath}`);

            selectedSentences = parseSubtitleFile(filePath);
            if (selectedSentences && selectedSentences.length > 0) {
              console.log(`Successfully parsed ${selectedSentences.length} subtitles from ${format}`);
              break;
            }
          }
        }

        if (selectedSentences && selectedSentences.length > 0) {
          break;
        }
      }
    }

    if (!selectedSentences || selectedSentences.length === 0) {
      return res.status(404).json({
        error: "Failed to parse subtitles from downloaded files.",
        availableLanguages: Object.keys(metadata.subtitles),
        videoId: actualVideoId,
      });
    }

    // ✅ BƯỚC 4: Trả về kết quả
    return res.status(200).json({
      success: true,
      sentences: selectedSentences,
      language: selectedLang,
      format: selectedFormat,
      count: selectedSentences.length,
      videoId: actualVideoId,
    });

  } catch (error) {
    console.error("Error fetching captions:", error);
    return res.status(500).json({
      error: "An unexpected error occurred while fetching the transcript.",
      details: error.message,
    });
  }
};