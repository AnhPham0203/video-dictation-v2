# 🚀 Local Development Guide

## Chạy Full Stack ở Localhost

### ⚡ Cách 1: Tự động (Recommended)

Chạy cả Frontend + API cùng lúc với một lệnh:

```bash
# Install dependencies
npm install

# Chạy full stack
npm run dev:full
```

**Kết quả:**

- 🔵 **API Server**: http://localhost:3000
- 🟣 **Frontend**: http://localhost:8080

Mở browser tại **http://localhost:8080** và test toàn bộ app!

---

### 🔧 Cách 2: Manual (Chạy riêng từng service)

**Terminal 1 - API Server:**

```bash
npm run api-local
```

→ API chạy ở `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

→ Frontend chạy ở `http://localhost:8080`

---

## 🎯 Testing

### Test API trực tiếp

```bash
# Test API function
npm run api-test

# Test với video cụ thể
npm run api-test VIDEO_ID
```

### Test qua browser

1. Start full stack: `npm run dev:full`
2. Mở http://localhost:8080
3. Paste YouTube URL và test

### Test qua curl

```bash
curl "http://localhost:3000/api/get-captions?videoId=dQw4w9WgXcQ"
```

---

## 📋 Environment Variables

Frontend sử dụng file `.env.local` để config API URL:

**`frontend/.env.local`** (Đã tạo sẵn):

```bash
VITE_API_BASE_URL=http://localhost:3000
```

**Production** (`frontend/.env.production`):

```bash
VITE_API_BASE_URL=
# Empty = same domain (Vercel)
```

---

## 🔍 Kiểm tra setup

### 1. Check API

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{ "status": "ok", "message": "Local API server is running" }
```

### 2. Check Frontend

Mở browser: http://localhost:8080

### 3. Check API integration

Paste YouTube URL vào form và click "Load Video"

---

## 🛠️ Troubleshooting

### Port đã được sử dụng

**API (port 3000):**

- Sửa PORT trong `api/server-local.js`
- Cập nhật `frontend/.env.local` cho đúng

**Frontend (port 8080):**

- Sửa trong `package.json`: `"dev": "vite --port 8081"`

### API không kết nối

1. Check console browser (F12)
2. Verify `frontend/.env.local` có `VITE_API_BASE_URL=http://localhost:3000`
3. Restart frontend sau khi thay đổi .env

### Lỗi CORS

- Check API server có log request không
- Verify CORS headers trong `api/get-captions.js`

### Module not found

```bash
# Root
npm install

# Frontend
cd frontend && npm install
```

---

## 📂 Project Structure

```
video-dictation-v2/
├── api/
│   ├── get-captions.js      # Main API (production)
│   ├── server-local.js      # Local dev server
│   └── test-local.js        # Quick test script
├── frontend/
│   ├── .env.local           # Local config (points to localhost:3000)
│   ├── .env.production      # Production config
│   └── src/
│       └── pages/Index.tsx  # Main app
└── package.json             # Root scripts
```

---

## 🚀 Workflow

### Local Development

1. `npm run dev:full` → Code và test
2. Thay đổi code → Auto reload
3. Test API: http://localhost:3000
4. Test App: http://localhost:8080

### Deploy to Vercel

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel tự động:

- Build frontend từ `frontend/`
- Deploy API từ `api/`
- Use production env vars

---

## 💡 Tips

1. **Hot reload:** Frontend tự reload, nhưng API cần restart manual
2. **Environment:** Local dùng `.env.local`, production dùng Vercel env vars
3. **Debugging:** Check console browser (F12) và terminal logs
4. **Testing:** Dùng `npm run api-test` để test nhanh API function

---

## ✅ Ready to develop!

```bash
npm run dev:full
```

Happy coding! 🎉
