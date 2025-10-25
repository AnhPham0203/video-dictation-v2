# API Local Testing Guide

## 🎯 Test API không cần Vercel CLI

### Cách 1: Test nhanh với script (Đơn giản nhất)

```bash
# Install dependencies trước
npm install

# Test với video mặc định
npm run api-test

# Test với video ID cụ thể
npm run api-test dQw4w9WgXcQ
```

**Output mẫu:**

```
🧪 Testing YouTube Transcript API (youtubei.js)
============================================================

📺 Testing with Video ID: dQw4w9WgXcQ
   URL: https://youtube.com/watch?v=dQw4w9WgXcQ

📊 Response Status: 200
✅ Success! Found 45 subtitle entries

📝 First 3 entries:
1. [0.00s] We're no strangers to love
2. [3.50s] You know the rules and so do I
3. [7.20s] A full commitment's what I'm thinking of
```

---

### Cách 2: Chạy local server (Giống production)

```bash
# Terminal 1: Start API server
npm run api-local

# Terminal 2: Test với curl hoặc browser
curl "http://localhost:3000/api/get-captions?videoId=dQw4w9WgXcQ"

# Hoặc mở browser
http://localhost:3000/api/get-captions?videoId=dQw4w9WgXcQ
```

**Server sẽ chạy trên:** `http://localhost:3000`

**Endpoints:**

- `GET /api/get-captions?videoId=YOUR_VIDEO_ID`
- `POST /api/translate`
- `GET /health` - Health check

---

### Cách 3: Test với frontend

1. Start API server:

```bash
npm run api-local
```

2. Sửa frontend config để point tới local API (nếu cần)

3. Test full flow với UI

---

## 📝 Files

- `api/get-captions.js` - API chính (production code)
- `api/server-local.js` - Local Express server wrapper
- `api/test-local.js` - Quick test script
- `api/translate.js` - Translation API

---

## 🔧 Troubleshooting

**Lỗi: Cannot find module 'express'**

```bash
npm install
```

**Lỗi: Port 3000 already in use**

- Đổi PORT trong `api/server-local.js`
- Hoặc kill process đang dùng port 3000

**Video không có phụ đề**

- Thử video khác có enable subtitles
- Check console logs để xem error cụ thể

---

## ✅ Production vs Local

| Feature     | Local (npm run api-local) | Production (Vercel) |
| ----------- | ------------------------- | ------------------- |
| Hot reload  | ❌ Phải restart           | ✅ Auto             |
| CORS        | ✅ Enabled                | ✅ Enabled          |
| Timeout     | ⚠️ No limit               | ✅ 30s              |
| Memory      | ⚠️ System limit           | ✅ 1024MB           |
| Environment | Node.js                   | Vercel Serverless   |

**Lưu ý:** Local test tốt cho debugging, nhưng nên test trên Vercel để đảm bảo hoạt động đúng trong production environment.
