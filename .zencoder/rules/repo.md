# Thông tin dự án

## Cấu trúc thư mục chính
- **frontend/**: Ứng dụng React/Vite chính, chứa mã nguồn hiển thị.
- **backend/**: Dịch vụ Python xử lý logic phía server.
- **GEMINI.md**: Quy tắc riêng liên quan đến tích hợp Gemini hoặc chỉ dẫn đặc biệt.
- **instruction.md** & **intrus.md**: Ghi chú hướng dẫn nội bộ.

## Chi tiết frontend
- **src/components/**: Chứa các component React tái sử dụng.
- **src/hooks/**: Các custom hook.
- **src/pages/**: Các trang chính của ứng dụng.
- **index.css, App.css**: Styling toàn cục.
- **Tailwind CSS** được cấu hình thông qua `tailwind.config.ts` và sử dụng lớp tiện ích trong component.

## Chi tiết backend
- **main.py**: Điểm vào của ứng dụng backend.
- **utils/**: Các tiện ích hỗ trợ như `youtube_service.py`.
- **requirements.txt**: Danh sách thư viện Python cần thiết.

## Quy ước chung
1. **Ngôn ngữ**: Frontend sử dụng TypeScript (TSX/TS), backend dùng Python 3.x.
2. **Styling**: Ưu tiên Tailwind CSS.
3. **Quy trình**: Khi chỉnh sửa, luôn kiểm tra xem component/logic đã được tách nhỏ để dễ bảo trì chưa.
4. **Testing**: Tạm thời chưa phát hiện bộ test tự động; cần tự kiểm tra thủ công sau khi chỉnh sửa.

## Ghi chú bổ sung
- Khi tối ưu hiệu năng, cân nhắc memo hóa component hoặc hook.
- Luôn đảm bảo các thao tác bàn phím trong `TypingPanel` hoạt động trơn tru và hỗ trợ người dùng đa dạng.