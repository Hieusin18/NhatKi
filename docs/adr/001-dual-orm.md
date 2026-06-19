# ADR-001: Dual ORM — Sequelize (REST API) và Prisma (Realtime Service)

- **Ngày:** 2026-06-19
- **Trạng thái:** Accepted — Migration planned for v1.1.0
- **Người quyết định:** Nhóm Setlog

---

## Bối cảnh

Hệ thống Setlog gồm hai backend service độc lập:

| Service | Entry point | ORM | Database |
|---------|-------------|-----|---------|
| REST API | `src/app.js` | **Sequelize** | MySQL 8 |
| Realtime (Socket.io + cron) | `backend/app.js` | **Prisma** | MySQL 8 (cùng DB) |

Hai service được phát triển song song bởi các thành viên khác nhau trong nhóm. REST API được khởi tạo trước với Sequelize. Realtime service được viết sau và chọn Prisma vì Prisma có hỗ trợ type-safe tốt hơn cho các truy vấn phức tạp (aggregation, nested include) cần thiết cho groupActivity và media search.

Ngoài ra, `src/controllers/groupController.js` ban đầu sử dụng Prisma cho toàn bộ (do được viết bởi thành viên quen với Prisma). Trong v1.0.0, các hàm CRUD đơn giản (`create`, `join`, `getOne`, `getMyGroups`, `regenerateCode`) đã được **migration sang Sequelize**. Chỉ còn `getGroupHistory` và `searchGroupMedia` giữ Prisma vì phụ thuộc vào model `GroupActivity` chưa có trong Sequelize schema.

---

## Quyết định

- **REST API** (`src/`) dùng **Sequelize** làm ORM chính.
- **Realtime service** (`backend/`) dùng **Prisma** vì đây là service độc lập với schema và migration riêng.
- Prisma **không** được dùng trong REST API layer sau v1.0.0 — ngoại trừ tạm thời cho `getGroupHistory` và `searchGroupMedia`.

---

## Hệ quả

**Ưu điểm của quyết định hiện tại:**
- Không break change cho production đang chạy.
- Mỗi service độc lập — failure isolation tốt hơn.
- Prisma schema của Realtime service có migration riêng (`backend/prisma/migrations/`).

**Nhược điểm đã biết:**
- Developer cần biết 2 ORM để contribute vào cả 2 service.
- Tăng kích thước `node_modules` tổng thể.
- Dễ nhầm lẫn khi trace bug cross-service.

---

## Kế hoạch Migration (v1.1.0)

1. Tạo Sequelize model `GroupActivity` tương đương Prisma schema.
2. Viết migration script để đồng bộ.
3. Refactor `getGroupHistory` và `searchGroupMedia` sang Sequelize.
4. Xóa import Prisma khỏi `src/controllers/groupController.js`.
5. Cân nhắc thống nhất toàn bộ backend về Prisma (type-safe, modern) trong v2.0.0 nếu nhóm đồng thuận.

---

## Tham khảo

- [Prisma vs Sequelize comparison](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-sequelize)
- `backend/prisma/schema.prisma` — Prisma schema cho Realtime service
- `src/models/` — Sequelize models cho REST API
