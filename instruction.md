# Huong Dan Du An Video Dictation

Tai lieu nay mo ta kien truc hien tai cua du an Video Dictation va cach thuc lam viec voi codebase sau khi tach thanh frontend (React) va cac API serverless.

## 1. Tong quan

Video Dictation giup luyen nghe va chinh ta tieng Anh thong qua video YouTube:
- Nhap URL YouTube, he thong tu dong lay phu de.
- Luyen nghe theo tung cau (hoac hai cau) voi che do Dictation, Typing, Transcript.
- Tu dong phat lai doan video tuong ung, danh dau tien do hoan thanh va thong bao loi.
- Co the goi API dich de hien thi ban dich tieng Viet.

## 2. Cau truc thu muc

- `frontend/`: ung dung React (Vite + TypeScript + Tailwind + shadcn-ui).
- `api/`: cac ham serverless (Vercel/Node) dung de lay phu de (`get-captions.js`) va dich (`translate.js`).
- `node_modules/`, `package.json`, `.env` goc phu vu chung cho serverless.

> Thu muc `backend/` cu dang de trong de giu lich su; tat ca logic backend da duoc thay bang ham serverless trong `api/`.

## 3. Cong nghe su dung

### Frontend
- React 18, Vite, TypeScript.
- Tailwind CSS, shadcn-ui.
- React Router DOM cho dinh tuyen.
- ESLint/TypeScript cho linting va kieu.

### API serverless
- Node.js (CommonJS) chay tren Vercel.
- `youtube-transcript` lay phu de tu YouTube.
- `axios` goi Google Cloud Translation API (yeu cau `GOOGLE_API_KEY`).

## 4. Cai dat & chay

### 4.1 Chuan bi
1. Cai dependencies chung:
   ```bash
   npm install
   ```
2. Tao file `.env` o thu muc goc va dien `GOOGLE_API_KEY=` (key luu tren local, khong commit). Co the tao them `frontend/.env` cho bien rieng cua client.

### 4.2 Chay moi truong phat trien

**Lua chon A – `vercel dev` (de nhat):**
```bash
npm install -g vercel
vercel dev
```
Lenh nay chay ca frontend (http://localhost:3000) va proxy cac ham trong `api/`.

**Lua chon B – chi chay Vite:**
1. Cap nhat `frontend/.env` voi `VITE_API_BASE_URL` tro den backend dang chay (vd Render hoac Vercel staging).
2. Chay Vite:
   ```bash
   cd frontend
   npm install
   npm run dev -- --port 8080
   ```

Frontend se doc `VITE_API_BASE_URL` va tu dong ghep voi duong dan `/api/*`.

### 4.3 Build
```bash
cd frontend
npm run build
```

## 5. Thanh phan quan trong

- `frontend/src/pages/Index.tsx`: quan ly trang chu, goi API lay phu de/dich, dieu khien che do luyen tap.
- `frontend/src/components/VideoPlayer.tsx`: nhung YouTube IFrame API va dieu khien phat lai theo doan.
- `frontend/src/components/DictationPanel.tsx`: giao dien nhap/cham chinh ta, dinh nghia feedback.
- `frontend/src/components/TranscriptView.tsx`: xem toan bo phu de va nhay den cau bat ky.
- `frontend/src/components/TypingPanel.tsx`: che do go lai cau.
- `api/get-captions.js`: goi `youtube-transcript` va tra ve danh sach cau.
- `api/translate.js`: goi Google Translate API theo key cung cap.

## 6. Quy uoc lam viec

- Uu tien Tailwind utility classes va component tu `frontend/src/components/ui`.
- State toan cuc duoc quan ly trong `Index.tsx` bang React Hooks.
- Luon chay `npm run lint` (frontend) truoc khi commit.
- Khong commit file `.env` goc/`frontend/.env` (da duoc bo sung vao `.gitignore`).

Neu can bo sung API hoac tinh nang moi, vui long cap nhat lai tai lieu nay de phan anh dung kien truc hien tai.
