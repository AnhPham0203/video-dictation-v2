video-dictation/
│
├── backend/                     # 🌐 Python FastAPI backend
│   ├── main.py                  # File chính khởi chạy server
│   ├── requirements.txt         # Danh sách thư viện cần cài
│   ├── __init__.py              # (tùy chọn, giúp import dễ hơn)
│   ├── utils/
│   │   └── youtube_service.py   # Hàm xử lý transcript YouTube
│   ├── logs/                    # (tuỳ chọn) ghi log backend
│   └── .env                     # (tuỳ chọn) chứa config secret
│
├── frontend/                    # 💻 React + Vite app
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx             # Entry chính React
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   └── VideoDictationPage.tsx  # Trang chính nghe chép
│   │   ├── components/
│   │   │   ├── VideoInput.tsx          # Nhập link video
│   │   │   ├── VideoPlayer.tsx         # ReactPlayer
│   │   │   ├── TranscriptDisplay.tsx   # Hiển thị phụ đề
│   │   │   └── DictationBox.tsx        # Ô nhập để người học điền
│   │   ├── hooks/
│   │   │   └── useCaptions.ts          # Custom hook fetch API
│   │   ├── styles/
│   │   │   └── index.css               # Tailwind hoặc custom
│   │   └── utils/
│   │       └── extractVideoId.ts       # Hàm tách videoId từ URL
│   └── public/
│       └── favicon.ico
│
└── README.md
