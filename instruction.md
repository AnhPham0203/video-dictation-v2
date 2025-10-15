# Hướng Dẫn Dự Án Video Dictation

Tài liệu này cung cấp hướng dẫn chi tiết về kiến trúc, công nghệ và quy trình làm việc của dự án Video Dictation. Mục tiêu là để giúp các lập trình viên (bao gồm cả AI) có thể hiểu và phát triển dự án một cách hiệu quả và nhất quán.

## 1. Tổng Quan Dự Án

Video Dictation là một ứng dụng web cho phép người dùng luyện kỹ năng nghe-chép tiếng Anh thông qua các video trên YouTube. Người dùng có thể dán URL của video, ứng dụng sẽ tải phụ đề và chia thành từng câu để người dùng nghe và gõ lại.

**Chức năng chính:**
- Tải phụ đề từ video YouTube.
- Cung cấp giao diện nghe-chép từng câu hoặc hai câu một lần.
- Phát lại đoạn video tương ứng với câu đang luyện tập.
- Kiểm tra độ chính xác của câu người dùng nhập vào.
- Hiển thị bản dịch và toàn bộ bản ghi của video.
- Che/hiện video để tập trung vào kỹ năng nghe.

## 2. Cấu Trúc Thư Mục

Dự án được chia thành hai phần chính:

-   `/frontend`: Chứa mã nguồn cho giao diện người dùng (client-side), được xây dựng bằng React.
-   `/backend`: Chứa mã nguồn cho máy chủ (server-side), được xây dựng bằng Python và FastAPI.

## 3. Công Nghệ Sử Dụng

### Frontend

-   **Framework:** React 18
-   **Build Tool:** Vite
-   **Ngôn ngữ:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** shadcn-ui
-   **Quản lý trạng thái:** React Hooks (`useState`, `useEffect`)
-   **Routing:** React Router DOM
-   **Linting:** ESLint

### Backend

-   **Framework:** FastAPI
-   **Ngôn ngữ:** Python
-   **Web Server:** Uvicorn
-   **Phụ thuộc chính:** `fastapi`, `uvicorn`, `youtube_transcript_api` (suy đoán)

## 4. Cài Đặt và Chạy Dự Án

### Frontend

1.  Di chuyển vào thư mục `frontend`:
    ```bash
    cd frontend
    ```
2.  Cài đặt các gói phụ thuộc:
    ```bash
    npm install
    ```
3.  Chạy máy chủ phát triển:
    ```bash
    npm run dev
    ```
    Ứng dụng sẽ chạy tại `http://localhost:5173` (hoặc một cổng khác nếu 5173 đã được sử dụng).

### Backend

1.  Di chuyển vào thư mục `backend`:
    ```bash
    cd backend
    ```
2.  Tạo môi trường ảo (khuyến khích):
    ```bash
    python -m venv venv
    source venv/bin/activate  # Trên Windows: venv\Scripts\activate
    ```
3.  Cài đặt các gói phụ thuộc (cần tạo tệp `requirements.txt` trước):
    ```bash
    pip install -r requirements.txt
    ```
4.  Chạy máy chủ:
    ```bash
    uvicorn main:app --reload --port 5000
    ```
    API sẽ có sẵn tại `http://localhost:5000`.

> 💡 **Triển khai trên Render:** Xem tài liệu `backend/RENDER_DEPLOYMENT.md` và file cấu hình `render.yaml` để thiết lập dịch vụ FastAPI trên Render thông qua Blueprint.

## 5. Kiến Trúc Chi Tiết

### Frontend

-   **`src/pages/Index.tsx`**: Đây là thành phần chính của ứng dụng, nơi quản lý hầu hết các trạng thái quan trọng như danh sách câu, câu hiện tại, chế độ nghe chép, v.v. Nó cũng chứa logic để gọi API từ backend và xử lý các sự kiện chính của người dùng.
-   **`src/components/VideoPlayer.tsx`**: Chịu trách nhiệm hiển thị trình phát video YouTube (sử dụng `react-player`) và xử lý việc tua video đến các đoạn cụ thể.
-   **`src/components/DictationPanel.tsx`**: Là giao diện chính cho việc nghe-chép, bao gồm ô nhập liệu, các nút điều khiển (Next, Previous, Play), và hiển thị phản hồi cho người dùng.
-   **`src/components/TranscriptView.tsx`**: Hiển thị toàn bộ bản ghi của video, cho phép người dùng nhấp vào một câu bất kỳ để chuyển đến câu đó.

### Backend

-   **`main.py`**: Tệp chính của ứng dụng FastAPI.
-   **API Endpoint `/api/captions` (POST):**
    -   Nhận một JSON body chứa `videoId`.
    -   Gọi hàm `fetch_youtube_captions` để lấy phụ đề.
    -   Trả về một JSON object chứa danh sách các câu (`sentences`) hoặc một lỗi (`error`).
-   **`utils/youtube_service.py`**: Module này chứa logic để tương tác với API của YouTube hoặc các thư viện bên thứ ba để lấy và xử lý phụ đề.

## 6. Quy Ước và Hướng Dẫn

-   **Styling:** Luôn ưu tiên sử dụng các utility classes của Tailwind CSS. Đối với các thành phần phức tạp, hãy sử dụng các component từ `shadcn-ui` và tùy chỉnh chúng nếu cần.
-   **Quản lý trạng thái:** Giữ trạng thái ở thành phần cha chung gần nhất. Hiện tại, `Index.tsx` là nơi quản lý trạng thái toàn cục của ứng dụng.
-   **Thêm Component Mới:** Khi tạo một component mới, hãy đặt nó trong thư mục `src/components`. Nếu đó là một UI component có thể tái sử dụng, hãy xem xét việc thêm nó vào `src/components/ui`.
-   **Định dạng mã:** Chạy `npm run lint` để kiểm tra và sửa lỗi định dạng mã trước khi commit.
-   **Commit Messages:** Viết commit message rõ ràng, mô tả ngắn gọn những thay đổi đã thực hiện.
