# ⚡ Quick Start - Chạy Full Stack Localhost

## 🚀 Bước 1: Install dependencies

```bash
npm install
```

## 🎯 Bước 2: Tạo file .env.production cho frontend

Tạo file `frontend/.env.production` với nội dung:

```bash
VITE_API_BASE_URL=
```

(File `.env.local` đã được tạo tự động)

## ✨ Bước 3: Chạy Full Stack

### Cách 1: Một lệnh (Recommended)

```bash
npm run dev:full
```

**Kết quả:**

- 🔵 API Server: http://localhost:3000
- 🟣 Frontend: http://localhost:8080

Mở browser tại: **http://localhost:8080**

### Cách 2: Chạy riêng (2 terminals)

**Terminal 1:**

```bash
npm run api-local
```

**Terminal 2:**

```bash
cd frontend
npm run dev
```

---

## 🧪 Test thử

1. Mở http://localhost:8080
2. Paste YouTube URL (ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
3. Click "Load Video"
4. Chọn tab Dictation/Typing/Transcript để test các tính năng

---

## ✅ Done!

Bây giờ bạn có thể:

- ✅ Test full app với frontend + API
- ✅ Debug API trong terminal
- ✅ Thay đổi code và xem live reload
- ✅ Test với video YouTube bất kỳ

---

## 🔧 Commands Summary

| Command                | Description               |
| ---------------------- | ------------------------- |
| `npm run dev:full`     | Chạy cả Frontend + API    |
| `npm run api-local`    | Chỉ chạy API server       |
| `npm run api-test`     | Test API với script nhanh |
| `npm run dev:frontend` | Chỉ chạy Frontend         |

---

## 📚 More Info

- **Local Dev Guide**: `LOCAL_DEV.md`
- **API Testing**: `api/README.md`
