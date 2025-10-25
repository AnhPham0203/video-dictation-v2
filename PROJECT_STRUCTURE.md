# 📁 YouTube Transcript Extractor - Project Structure & Implementation Guide

## 🎯 Mục đích

Website lấy transcript (phụ đề) từ video YouTube, deploy lên Vercel thành công.

---

## 🛠️ Stack công nghệ

### Framework & Language

- **Next.js 14+** với App Router
- **TypeScript** (strict mode)
- **React 18.2+**

### UI/Styling

- **Tailwind CSS** cho styling
- Responsive design
- Modern gradient UI

### Backend/API

- **Next.js API Routes** (Serverless Functions)
- **youtubei.js v10.5.0** - Thư viện chính thức để lấy transcript

### Deployment

- **Vercel** (Serverless)
- Node.js 20.x (auto-detected)

---

## 📂 Cấu trúc thư mục

```
youtube-transcript/
├── app/
│   ├── api/
│   │   └── transcript/
│   │       └── route.ts          # 🔥 API endpoint chính
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Trang chủ (Client Component)
│   └── globals.css               # Global styles + Tailwind
│
├── components/
│   ├── Header.tsx                # Header component
│   ├── TranscriptForm.tsx        # Form nhập YouTube URL
│   └── TranscriptDisplay.tsx     # Hiển thị kết quả transcript
│
├── public/                       # Static assets (empty)
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── next.config.js                # Next.js config (JS, NOT TS!)
├── vercel.json                   # Vercel deployment config
├── .gitignore                    # Git ignore
├── .eslintrc.json                # ESLint config
└── README.md                     # Documentation
```

---

## 🔥 Core Files - Chi tiết Implementation

### 1. **API Route**: `app/api/transcript/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

// Extract video ID từ YouTube URL
function extractVideoId(url: string): string | null {
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of regexPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Lấy transcript bằng youtubei.js
async function getTranscript(videoId: string): Promise<TranscriptItem[]> {
  try {
    const youtube = await Innertube.create({
      cache: undefined, // Disable cache
    });

    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    if (!transcriptData) {
      throw new Error("Video này không có phụ đề");
    }

    // ⚠️ QUAN TRỌNG: Null check trước khi truy cập nested properties
    const segments = transcriptData.transcript?.content?.body?.initial_segments;

    if (!segments || !Array.isArray(segments)) {
      throw new Error("Không có nội dung transcript");
    }

    // Map sang format chuẩn
    const captions: TranscriptItem[] = segments.map((segment: any) => ({
      text: (segment.snippet?.text || "").trim(),
      offset: segment.start_ms || 0,
      duration: (segment.end_ms || 0) - (segment.start_ms || 0),
    }));

    if (captions.length === 0) {
      throw new Error("Không có nội dung transcript");
    }

    return captions;
  } catch (error) {
    console.error("Error fetching transcript:", error);

    if (error instanceof Error) {
      if (error.message.includes("Transcript is disabled")) {
        throw new Error("Video này đã tắt phụ đề");
      }
      if (error.message.includes("not available")) {
        throw new Error("Video không khả dụng hoặc bị giới hạn");
      }
    }
    throw error;
  }
}

// POST endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL là bắt buộc" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url.trim());

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "URL YouTube không hợp lệ" },
        { status: 400 }
      );
    }

    const transcript = await getTranscript(videoId);

    return NextResponse.json({
      success: true,
      data: transcript,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Có lỗi không xác định";

    let userMessage = errorMessage;

    // Error mapping
    if (
      errorMessage.includes("age-gated") ||
      errorMessage.includes("unavailable")
    ) {
      userMessage = "Video bị hạn chế hoặc không khả dụng";
    } else if (errorMessage.includes("không có phụ đề")) {
      userMessage =
        "Video này không có phụ đề. Vui lòng chọn video khác có phụ đề.";
    }

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}

// GET endpoint (optional)
export async function GET() {
  return NextResponse.json({
    message: "YouTube Transcript API",
    instructions: "Sử dụng POST request với YouTube URL",
  });
}
```

---

### 2. **Frontend Page**: `app/page.tsx`

```typescript
"use client";

import { useState } from "react";
import TranscriptForm from "@/components/TranscriptForm";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import Header from "@/components/Header";

interface TranscriptResult {
  success: boolean;
  data?: Array<{
    text: string;
    offset: number;
    duration: number;
  }>;
  error?: string;
}

export default function Home() {
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>("");

  const handleFetchTranscript = async (url: string) => {
    setLoading(true);
    setTranscript(null);

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data: TranscriptResult = await response.json();
      setTranscript(data);

      if (data.success && data.data) {
        const videoId = extractVideoId(url);
        setVideoTitle(`Video: ${videoId}`);
      }
    } catch (error) {
      setTranscript({
        success: false,
        error: error instanceof Error ? error.message : "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : "Unknown";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <TranscriptForm
              onSubmit={handleFetchTranscript}
              loading={loading}
            />
          </div>

          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 inline-block"></div>
              <p className="mt-4 text-gray-600 font-medium">
                Đang lấy transcript...
              </p>
            </div>
          )}

          {transcript && !loading && (
            <TranscriptDisplay
              transcript={transcript}
              videoTitle={videoTitle}
            />
          )}
        </div>
      </div>
    </main>
  );
}
```

---

### 3. **Component**: `components/TranscriptForm.tsx`

```typescript
"use client";

import { useState } from "react";

interface TranscriptFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export default function TranscriptForm({
  onSubmit,
  loading,
}: TranscriptFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateYoutubeUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return regex.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Vui lòng nhập URL YouTube");
      return;
    }

    if (!validateYoutubeUrl(url)) {
      setError("URL không hợp lệ. Vui lòng nhập link YouTube hợp lệ");
      return;
    }

    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          YouTube Video URL
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Lấy Transcript"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}
    </form>
  );
}
```

---

### 4. **Component**: `components/TranscriptDisplay.tsx`

```typescript
"use client";

import { useState } from "react";

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

interface TranscriptDisplayProps {
  transcript: {
    success: boolean;
    data?: TranscriptItem[];
    error?: string;
  };
  videoTitle: string;
}

export default function TranscriptDisplay({
  transcript,
  videoTitle,
}: TranscriptDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!transcript.success) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <span className="text-2xl">❌</span>
          <h2 className="text-xl font-semibold">Lỗi</h2>
        </div>
        <p className="text-gray-700">{transcript.error}</p>
      </div>
    );
  }

  const transcriptText = transcript.data
    ?.map((item) => item.text)
    .join(" ")
    .trim();

  const handleCopy = async () => {
    if (transcriptText) {
      await navigator.clipboard.writeText(transcriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (transcriptText) {
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(transcriptText)
      );
      element.setAttribute("download", `transcript-${videoTitle}.txt`);
      element.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transcript</h2>
          <p className="text-sm text-gray-500">{videoTitle}</p>
        </div>
        <div className="text-sm text-gray-600">
          {transcript.data?.length || 0} dòng
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {copied ? "✓ Đã sao chép!" : "📋 Sao chép"}
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          💾 Tải xuống
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-96 overflow-y-auto">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {transcriptText}
        </p>
      </div>
    </div>
  );
}
```

---

## 📦 package.json

```json
{
  "name": "youtube-transcript",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "youtubei.js": "^10.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

---

## ⚙️ vercel.json

```json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

**⚠️ LƯU Ý:**

- KHÔNG thêm `"nodeVersion"` - Vercel sẽ báo lỗi!
- Vercel tự động detect Next.js

---

## 🎨 Tailwind Config: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

---

## 🔧 Next.js Config: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

**⚠️ QUAN TRỌNG:** Phải là `.js` không phải `.ts`!

---

## 🚀 Deploy lên Vercel

### Bước 1: Push lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/repo.git
git push -u origin main
```

### Bước 2: Import vào Vercel

1. Vào https://vercel.com/new
2. Import repository
3. Framework: Next.js (auto-detect)
4. Click Deploy

### Bước 3: Done!

Domain: `https://your-project.vercel.app`

---

## 🔥 Key Points - Điểm quan trọng

### ✅ Thành công vì:

1. **Dùng `youtubei.js`** - Thư viện chính thức, stable
2. **Null checks** - Tránh lỗi TypeScript với optional chaining (`?.`)
3. **Error handling** - Xử lý các lỗi cụ thể và message thân thiện
4. **Vercel config đúng** - Timeout 30s, memory 1024MB
5. **Next.js 14 App Router** - Modern architecture
6. **Serverless API Routes** - Scale tốt trên Vercel

### ❌ Tránh:

1. Dùng `youtube-transcript` - Không ổn định
2. Parse HTML thủ công - Dễ break khi YouTube update
3. Thêm `nodeVersion` vào `vercel.json` - Vercel báo lỗi
4. Dùng `next.config.ts` - Phải là `.js`
5. Không có null checks - TypeScript error

---

## 📝 Checklist khi migrate project khác

- [ ] Cài `youtubei.js` thay vì library cũ
- [ ] Copy code từ `app/api/transcript/route.ts`
- [ ] Đảm bảo có null checks với `?.`
- [ ] Tạo `vercel.json` với timeout 30s
- [ ] `next.config.js` không phải `.ts`
- [ ] Test local với `npm run dev`
- [ ] Push lên GitHub
- [ ] Deploy trên Vercel
- [ ] Test production URL

---

## 🎯 API Response Format

### Success:

```json
{
  "success": true,
  "data": [
    {
      "text": "Hello everyone",
      "offset": 0,
      "duration": 2000
    }
  ]
}
```

### Error:

```json
{
  "success": false,
  "error": "Video này không có phụ đề"
}
```

---

## 📞 Contact & Support

Nếu có vấn đề:

1. Check console logs trên Vercel Dashboard
2. Verify video có phụ đề
3. Test với video khác
4. Check API timeout (30s có đủ không)

**Hết! Đem file này sang project kia và show cho Cursor là OK! 🚀**
