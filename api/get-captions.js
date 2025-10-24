// Version mới sử dụng youtube-transcript package (nhẹ hơn, không cần binary)
const { YoutubeTranscript } = require('youtube-transcript');

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
    // Thử lấy phụ đề tiếng Anh trước
    let transcriptData = null;
    let language = 'en';
    
    try {
      // Thử English trước
      transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
      });
      language = 'en';
      console.log("Found English subtitles");
    } catch (enError) {
      console.log("English not found, trying Vietnamese...");
      try {
        // Nếu không có English, thử Vietnamese
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'vi',
        });
        language = 'vi';
        console.log("Found Vietnamese subtitles");
      } catch (viError) {
        console.log("Vietnamese not found, trying auto-generated...");
        // Nếu không có cả 2, lấy bất kỳ ngôn ngữ nào có
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        language = 'auto';
        console.log("Using auto-generated subtitles");
      }
    }

    if (!transcriptData || transcriptData.length === 0) {
      return res.status(404).json({
        error: "No subtitles found for this video.",
        videoId: videoId,
      });
    }

    // Chuyển đổi format để match với format cũ
    const sentences = transcriptData.map((item) => ({
      text: item.text,
      start: item.offset / 1000, // Chuyển từ ms sang seconds
      duration: item.duration / 1000, // Chuyển từ ms sang seconds
    }));

    console.log(`Successfully fetched ${sentences.length} subtitle entries`);

    return res.status(200).json({
      success: true,
      sentences: sentences,
      language: language,
      format: 'json',
      count: sentences.length,
      videoId: videoId,
    });

  } catch (error) {
    console.error("Error fetching transcript:", error);
    
    // Kiểm tra các lỗi cụ thể
    if (error.message && error.message.includes('Transcript is disabled')) {
      return res.status(404).json({
        error: "Subtitles are disabled for this video.",
        videoId: videoId,
      });
    }
    
    if (error.message && error.message.includes('No transcripts available')) {
      return res.status(404).json({
        error: "No subtitles found for this video.",
        videoId: videoId,
      });
    }

    return res.status(500).json({
      error: "An unexpected error occurred while fetching the transcript.",
      details: error.message,
    });
  }
};

