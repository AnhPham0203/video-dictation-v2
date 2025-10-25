# 🎙️ Pronunciation Feature Setup Guide

## 🌟 Tính năng

Hệ thống pronunciation mới với **3-tier fallback strategy**:

1. **Merriam-Webster API** (Primary) - Chất lượng cao, audio rõ ràng
2. **WordsAPI** (Secondary) - Backup nếu API 1 fail
3. **Free Dictionary API** (Fallback) - Last resort, không cần API key

### ✅ Lợi ích:

- **Stable**: Nếu 1 API down, tự động chuyển sang API khác
- **Fast**: Cache 7 ngày trong localStorage
- **Quality**: Merriam-Webster có audio và IPA chính xác nhất
- **Free**: Cả 2 API đều có free tier đủ dùng

---

## 📝 Cách setup API Keys

### 1. Merriam-Webster Dictionary API (Recommended)

**Đăng ký miễn phí:**

1. Vào: https://dictionaryapi.com/
2. Click "Register for a Key"
3. Chọn "Collegiate Dictionary" (miễn phí)
4. Nhận API key qua email

**Free tier:**

- ✅ 1,000 requests/day
- ✅ Không cần credit card
- ✅ Audio quality cao
- ✅ IPA phonetics đầy đủ

**Add vào `.env.local`:**

```bash
VITE_MERRIAM_WEBSTER_KEY=your-api-key-here
```

---

### 2. WordsAPI (Optional - Backup)

**Đăng ký:**

1. Vào: https://rapidapi.com/dpventures/api/wordsapi
2. Sign up với RapidAPI
3. Subscribe "Basic" plan (FREE)
4. Copy API key từ dashboard

**Free tier:**

- ✅ 2,500 requests/day
- ✅ Không cần credit card
- ❌ Không có audio (chỉ phonetics text)

**Add vào `.env.local`:**

```bash
VITE_WORDS_API_KEY=your-rapidapi-key-here
```

---

## 🚀 Cách sử dụng

### Không có API key:

Vẫn hoạt động! Sẽ dùng Free Dictionary API (tier 3)

```bash
# Không cần config gì, chạy luôn
npm run dev:full
```

### Có 1 API key (Merriam-Webster):

```bash
# frontend/.env.local
VITE_MERRIAM_WEBSTER_KEY=abc123xyz
VITE_API_BASE_URL=http://localhost:3000
```

### Có cả 2 API keys (Best):

```bash
# frontend/.env.local
VITE_MERRIAM_WEBSTER_KEY=abc123xyz
VITE_WORDS_API_KEY=def456uvw
VITE_API_BASE_URL=http://localhost:3000
```

---

## 🧪 Test thử

### 1. Start app:

```bash
npm run dev:full
```

### 2. Load một video YouTube có phụ đề

### 3. Click vào từ bất kỳ để xem pronunciation

### 4. Check console để xem API nào được dùng:

```
🔍 Trying Merriam-Webster for: hello
✅ Merriam-Webster succeeded
```

hoặc nếu API 1 fail:

```
🔍 Trying Merriam-Webster for: hello
❌ Merriam-Webster failed
🔍 Trying WordsAPI for: hello
✅ WordsAPI succeeded
```

---

## 💾 Cache Strategy

- ✅ Mỗi từ được cache **7 ngày** trong localStorage
- ✅ Lần 2 trở đi → Load instant, không gọi API
- ✅ Button "Retry" để force refresh nếu cần

**Xóa cache:**

```javascript
// Trong browser console
localStorage.clear();
```

---

## 🎯 API Fallback Flow

```
User clicks word
    ↓
Check localStorage cache (7 days)
    ↓ (if no cache)
Try Merriam-Webster API
    ↓ (if fail)
Try WordsAPI
    ↓ (if fail)
Try Free Dictionary API
    ↓ (if all fail)
Show error with Retry button
```

---

## 📊 So sánh APIs

| Feature     | Merriam-Webster | WordsAPI  | Free Dictionary |
| ----------- | --------------- | --------- | --------------- |
| Audio       | ✅ High quality | ❌ No     | ✅ OK quality   |
| IPA         | ✅ Accurate     | ✅ Good   | ✅ OK           |
| Definitions | ✅ Detailed     | ✅ Good   | ✅ Basic        |
| Examples    | ✅ Yes          | ✅ Yes    | ✅ Limited      |
| Rate Limit  | 1,000/day       | 2,500/day | Unlimited       |
| Stability   | ✅ Excellent    | ✅ Good   | ⚠️ Medium       |
| API Key     | Required        | Required  | No              |

---

## 🔧 Troubleshooting

### Lỗi: "API key not configured"

→ Chưa set environment variable. Tạo file `frontend/.env.local` với API keys

### Lỗi: "All pronunciation APIs failed"

→ Tất cả 3 APIs đều fail (hiếm gặp)
→ Check internet connection
→ Verify API keys đúng

### Từ không tìm thấy

→ Có thể từ không có trong database
→ Thử từ khác hoặc check spelling

### Audio không play

→ Browser block autoplay
→ User cần interact với page trước (click button)

---

## 🎨 Customization

### Thay đổi cache duration:

```typescript
// frontend/src/services/pronunciationService.ts
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
// Change to: 1 * 24 * 60 * 60 * 1000; // 1 day
```

### Thêm API mới:

```typescript
// Thêm vào apis array
const apis = [
  { name: "Merriam-Webster", fn: fetchFromMerriamWebster },
  { name: "WordsAPI", fn: fetchFromWordsAPI },
  { name: "Your New API", fn: fetchFromYourAPI }, // Add here
  { name: "Free Dictionary", fn: fetchFromFreeDictionary },
];
```

---

## ✅ Best Practices

1. **Production**: Nên có ít nhất 1 API key (Merriam-Webster)
2. **Development**: Có thể dùng Free Dictionary để test
3. **Monitoring**: Check console logs để biết API nào đang được dùng
4. **Rate Limits**: Với cache 7 ngày, ít khi hit rate limit

---

## 🆘 Support

Nếu có vấn đề:

1. Check console logs (F12)
2. Verify API keys trong `.env.local`
3. Test trực tiếp API endpoint
4. Clear cache và retry

---

**Happy Learning! 🎉**
