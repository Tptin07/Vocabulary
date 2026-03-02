# VocabMaster 📚

Ứng dụng web luyện tập từ vựng fullstack với giao diện hiện đại.

## Tech Stack

| Layer    | Technologies                     |
| -------- | -------------------------------- |
| Frontend | Vite, React, React Router, Axios |
| Backend  | Node.js, Express                 |
| Database | SQLite (sql.js)                  |

## Tính Năng

- 📚 **Quản lý từ vựng** — Thêm, sửa, xóa từ với tìm kiếm và lọc danh mục
- 🎯 **Luyện tập** — Quiz 4 đáp án trắc nghiệm, không giới hạn thời gian
- ⏱️ **Kiểm tra** — Quiz có đồng hồ đếm ngược 20s/câu, lưu điểm
- 🃏 **Flashcard** — Thẻ lật 3D, đánh dấu biết/chưa biết
- 📅 **Lịch sử** — Xem từ vựng theo ngày + lịch sử điểm kiểm tra

## Cài Đặt & Chạy

### Backend

```bash
cd backend
npm install
node server.js
# Server chạy tại http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App chạy tại http://localhost:5173
```

## Cấu Trúc Dự Án

```
Vocabulary_web/
├── backend/
│   ├── server.js
│   ├── database.js
│   └── routes/
│       ├── words.js
│       └── testResults.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── api/index.js
        └── pages/
            ├── WordManager.jsx
            ├── Practice.jsx
            ├── Test.jsx
            ├── Flashcard.jsx
            └── History.jsx
```
