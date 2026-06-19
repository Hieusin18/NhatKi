# Contributing to Setlog

Cảm ơn bạn đã quan tâm đến Setlog! Tài liệu này hướng dẫn quy trình đóng góp.

---

## Quy trình làm việc

```
Issue → Branch → Code → Test → PR → Review → Merge
```

1. **Chọn hoặc tạo Issue** mô tả việc cần làm
2. **Tạo branch** từ `main` theo quy ước đặt tên:
   ```bash
   git checkout -b feat/ten-tinh-nang     # tính năng mới
   git checkout -b fix/mo-ta-loi          # sửa lỗi
   git checkout -b docs/cap-nhat-tai-lieu # tài liệu
   ```
3. **Viết code** theo chuẩn dưới đây
4. **Chạy tests** trước khi tạo PR:
   ```bash
   npm test          # REST API unit tests
   npm run dev       # kiểm tra thủ công
   ```
5. **Tạo Pull Request** vào `main`, điền đầy đủ theo PR template
6. **Chờ review** — ít nhất 1 thành viên khác phải approve trước khi merge

---

## Chuẩn commit message

Theo [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <mô tả ngắn>

type: feat | fix | docs | test | chore | refactor
scope: backend | mobile | devops | auth | capsule | diary | feed | mood
```

Ví dụ:
```
feat(capsule): add countdown timer display
fix(auth): handle expired JWT gracefully
docs(readme): update setup instructions
```

---

## Chuẩn code

### Backend (Node.js)
- Dùng JSDoc cho tất cả hàm public trong `src/controllers/`
- Xử lý lỗi bằng try/catch, trả về HTTP status code đúng nghĩa
- Không commit secrets — dùng biến môi trường qua `.env`
- Validate input ở đầu mỗi route handler

### Mobile (React Native / Expo)
- Đặt tên component theo PascalCase
- Props phải có TypeScript type hoặc PropTypes
- Không hardcode URL — dùng `api.service.ts`

---

## Setup môi trường local

```bash
# Clone repo
git clone https://github.com/Hieusin18/NhatKi.git
cd NhatKi

# Cài dependencies
npm install          # REST API
cd backend && npm install   # Realtime service
cd ../mobile && npm install # Mobile

# Cấu hình môi trường
cp deploy/.env.production.example .env
# Điền DB_*, JWT_SECRET, CLOUDINARY_*

# Chạy migration & seed
npm run migrate && npm run seed

# Chạy dev
npm run dev          # REST API port 4000
cd backend && npm run dev  # Realtime port 5000
cd mobile && npx expo start
```

---

## Báo lỗi / Đề xuất tính năng

Dùng [GitHub Issues](https://github.com/Hieusin18/NhatKi/issues) với template có sẵn:
- **Bug report** — mô tả lỗi, bước tái hiện, kết quả mong đợi
- **Feature request** — user story, acceptance criteria, độ ưu tiên

---

## Câu hỏi?

Mở Issue với label `question` hoặc liên hệ trực tiếp team qua GitHub.
