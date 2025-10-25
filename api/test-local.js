// Quick test script for local API testing
const getCaptionsHandler = require("./get-captions.js");

// Test video IDs
const TEST_VIDEOS = {
  // Video có phụ đề tiếng Anh
  english: "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
  // Hoặc thay bằng video ID của bạn
};

// Mock request and response objects
function createMockReq(videoId) {
  return {
    method: "GET",
    query: { videoId },
    headers: {},
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      console.log("\n📊 Response Status:", this.statusCode);
      console.log("📦 Response Data:", JSON.stringify(data, null, 2));

      if (data.success && data.sentences) {
        console.log(`\n✅ Success! Found ${data.count} subtitle entries`);
        console.log("\n📝 First 3 entries:");
        data.sentences.slice(0, 3).forEach((s, i) => {
          console.log(`${i + 1}. [${s.start.toFixed(2)}s] ${s.text}`);
        });
      } else if (data.error) {
        console.log(`\n❌ Error: ${data.error}`);
      }
    },

    end() {
      console.log("Response ended");
    },

    setHeader(key, value) {
      this.headers[key] = value;
    },
  };

  return res;
}

// Run test
async function test() {
  console.log("🧪 Testing YouTube Transcript API (youtubei.js)\n");
  console.log("=".repeat(60));

  // Get video ID from command line or use default
  const videoId = process.argv[2] || TEST_VIDEOS.english;
  console.log(`\n📺 Testing with Video ID: ${videoId}`);
  console.log(`   URL: https://youtube.com/watch?v=${videoId}\n`);

  try {
    const req = createMockReq(videoId);
    const res = createMockRes();

    await getCaptionsHandler(req, res);
  } catch (error) {
    console.error("\n💥 Test failed:", error);
  }
}

// Run the test
test();
