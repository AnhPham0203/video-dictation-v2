# 📺 Video Suggestions Feature

## 🌟 Tổng quan

Feature này hiển thị danh sách các video có sẵn để user có thể click vào và bắt đầu học ngay, không cần phải tìm và paste URL.

## ✨ Tính năng

- ✅ Hiển thị grid responsive của video cards
- ✅ Thumbnail preview với hover effect
- ✅ Badge hiển thị level (Beginner/Intermediate/Advanced)
- ✅ Badge hiển thị category
- ✅ Duration display
- ✅ Click để load video tự động
- ✅ Auto scroll lên top khi chọn video
- ✅ Highlight video đang được chọn

## 📁 File structure

```
frontend/src/
├── data/
│   └── videoSuggestions.ts    # Danh sách video và data models
└── components/
    └── SuggestedVideos.tsx    # Component hiển thị
```

## 🎯 Cách thêm video mới

### Bước 1: Thêm vào data file

Mở `frontend/src/data/videoSuggestions.ts` và thêm video mới vào array:

```typescript
export const videoSuggestions: VideoSuggestion[] = [
  // ... existing videos ...
  {
    id: "YOUR_VIDEO_ID", // YouTube video ID (11 ký tự)
    title: "Video Title Here", // Tiêu đề
    description: "Brief description", // Mô tả ngắn
    thumbnail: "https://i.ytimg.com/vi/YOUR_VIDEO_ID/mqdefault.jpg", // Thumbnail URL
    duration: "5:30", // Độ dài video
    level: "Intermediate", // Beginner | Intermediate | Advanced
    category: "Education", // News | Education | Entertainment | Technology | Business
  },
];
```

### Bước 2: Lấy thông tin video

#### Cách 1: Thủ công

1. **Video ID**: Từ URL `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   → ID là `dQw4w9WgXcQ`

2. **Thumbnail**: Replace `YOUR_VIDEO_ID` trong URL:

   ```
   https://i.ytimg.com/vi/YOUR_VIDEO_ID/mqdefault.jpg
   ```

3. **Duration**: Xem trên YouTube

#### Cách 2: Tự động (recommended)

Dùng YouTube Data API (nếu bạn muốn tích hợp sau):

```typescript
// Example helper function (có thể thêm sau)
async function getVideoInfo(videoId: string) {
  const API_KEY = "YOUR_YOUTUBE_API_KEY";
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${API_KEY}`
  );
  const data = await response.json();
  return {
    title: data.items[0].snippet.title,
    description: data.items[0].snippet.description,
    thumbnail: data.items[0].snippet.thumbnails.medium.url,
    duration: data.items[0].contentDetails.duration, // ISO 8601 format
  };
}
```

## 🎨 Customization

### Thay đổi layout

Trong `SuggestedVideos.tsx`, dòng 47:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

Điều chỉnh breakpoints:

- `grid-cols-1`: Mobile (1 cột)
- `md:grid-cols-2`: Tablet (2 cột)
- `lg:grid-cols-3`: Desktop nhỏ (3 cột)
- `xl:grid-cols-4`: Desktop lớn (4 cột)

### Thay đổi màu level badges

Trong `SuggestedVideos.tsx`, function `getLevelColor`:

```typescript
const getLevelColor = (level: VideoSuggestion["level"]) => {
  switch (level) {
    case "Beginner":
      return "bg-green-500/20 text-green-400"; // Xanh lá
    case "Intermediate":
      return "bg-yellow-500/20 text-yellow-400"; // Vàng
    case "Advanced":
      return "bg-red-500/20 text-red-400"; // Đỏ
  }
};
```

### Thêm filter theo level/category

```typescript
// Trong component
const [selectedLevel, setSelectedLevel] = useState<
  VideoSuggestion["level"] | null
>(null);
const [selectedCategory, setSelectedCategory] = useState<
  VideoSuggestion["category"] | null
>(null);

// Filter logic
const filteredVideos = videoSuggestions.filter((video) => {
  if (selectedLevel && video.level !== selectedLevel) return false;
  if (selectedCategory && video.category !== selectedCategory) return false;
  return true;
});
```

Sau đó thêm UI cho filter buttons trước grid:

```tsx
<div className="flex gap-2 mb-4">
  <Button onClick={() => setSelectedLevel("Beginner")}>Beginner</Button>
  <Button onClick={() => setSelectedLevel("Intermediate")}>Intermediate</Button>
  <Button onClick={() => setSelectedLevel("Advanced")}>Advanced</Button>
  <Button onClick={() => setSelectedLevel(null)}>All</Button>
</div>
```

## 🔍 Gợi ý video hay cho dictation

### Beginner Level (Phát âm rõ ràng, tốc độ chậm)

- TED-Ed animations
- Simple songs (Disney, children's songs)
- News in Slow English
- Basic conversations

### Intermediate Level

- TED Talks (chọn speakers phát âm rõ)
- Movie trailers
- Popular songs
- News broadcasts (BBC, CNN)

### Advanced Level

- Podcasts
- Fast-paced songs (rap, hip-hop)
- Technical presentations
- Native speaker conversations

## 📝 Best practices

1. **Chọn video có subtitles**: Verify trước khi thêm
2. **Độ dài hợp lý**: 2-10 phút là tốt nhất
3. **Nội dung phù hợp**: Tránh nội dung nhạy cảm
4. **Chất lượng audio**: Đảm bảo âm thanh rõ ràng
5. **Variety**: Đa dạng category và level

## 🧪 Testing

```bash
# Run development server
npm run dev:full

# Navigate to homepage
# Scroll down to see Suggested Videos
# Click on a video card
# Verify video loads and subtitles appear
```

## 🐛 Troubleshooting

### Video không có subtitles

→ YouTube video cần có English captions
→ Check bằng cách thử load manual trước khi add vào list

### Thumbnail không hiển thị

→ Kiểm tra URL format: `https://i.ytimg.com/vi/VIDEO_ID/mqdefault.jpg`
→ Video có thể bị private hoặc deleted

### Video bị geo-blocked

→ Một số video chỉ available ở certain countries
→ Test từ target market của bạn

## 🚀 Future enhancements

- [ ] Pagination nếu có nhiều video
- [ ] Search trong suggestions
- [ ] Filter by level/category UI
- [ ] "Add to favorites" feature
- [ ] User-submitted suggestions
- [ ] Tích hợp YouTube Data API để auto-fetch info
- [ ] Sorting options (newest, most popular, etc.)
- [ ] Play count statistics
- [ ] User progress tracking per video

---

**Happy Learning! 🎉**
