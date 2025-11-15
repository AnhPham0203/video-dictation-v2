// Local development server for testing API functions without Vercel CLI
require('dotenv').config();
const express = require("express");
const getCaptionsHandler = require("./get-captions.js");
const translateHandler = require("./translate.js");
const textToSpeechHandler = require("./text-to-speech.js");

const app = express();
const PORT = 3000;

app.use(express.json());

// Mock Vercel's request/response to work with Express
function wrapVercelFunction(handler) {
  return async (req, res) => {
    // Transform Express req to Vercel-like req
    const vercelReq = {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: req.headers,
    };

    // Transform Express res to Vercel-like res
    const vercelRes = {
      status: (code) => {
        res.status(code);
        return vercelRes;
      },
      json: (data) => {
        res.json(data);
      },
      end: () => {
        res.end();
      },
      setHeader: (key, value) => {
        res.setHeader(key, value);
      },
    };

    await handler(vercelReq, vercelRes);
  };
}

// API routes
app.get("/api/get-captions", wrapVercelFunction(getCaptionsHandler));
app.options("/api/get-captions", wrapVercelFunction(getCaptionsHandler));

app.post("/api/translate", wrapVercelFunction(translateHandler));
app.options("/api/translate", wrapVercelFunction(translateHandler));

app.post("/api/text-to-speech", wrapVercelFunction(textToSpeechHandler));
app.options("/api/text-to-speech", wrapVercelFunction(textToSpeechHandler));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Local API server is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running at http://localhost:${PORT}`);
  console.log(
    `📺 Get captions: http://localhost:${PORT}/api/get-captions?videoId=YOUR_VIDEO_ID`
  );
  console.log(`🌐 Translate: POST http://localhost:${PORT}/api/translate`);
  console.log(
    `🔊 Text-to-Speech: POST http://localhost:${PORT}/api/text-to-speech`
  );
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});
