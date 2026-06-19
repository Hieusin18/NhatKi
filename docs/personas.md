# Personas & User Stories — Setlog

Tài liệu này mô tả người dùng mục tiêu và các user story cốt lõi của **Setlog**.
Chi tiết đặc tả đầy đủ xem tại [SRS.md](../SRS.md).

---

## Product Vision

> **Setlog** giúp người dùng không chỉ ghi lại cuộc sống mà còn hiểu rõ cảm xúc và kết nối với bản thân theo thời gian — thông qua nhật ký cá nhân, theo dõi mood, và Time Capsule.

**Vấn đề cần giải quyết:** Con người thường quên đi những khoảnh khắc và cảm xúc quan trọng trong cuộc sống. Các ứng dụng nhật ký hiện tại thiếu chiều sâu cảm xúc và không cho phép "gửi thư cho bản thân tương lai".

---

## Personas

### Persona 1 — Minh (22 tuổi, Sinh viên đại học)

| Thuộc tính | Chi tiết |
|:-----------|:---------|
| **Nghề nghiệp** | Sinh viên năm 3, học CNTT |
| **Mục tiêu** | Ghi lại hành trình học tập, theo dõi tiến độ bản thân |
| **Nỗi đau** | Hay quên những bài học và cảm xúc từ các giai đoạn khó khăn |
| **Thiết bị** | Dùng smartphone Android chủ yếu |
| **Động lực dùng Setlog** | Muốn xem lại "mình ngày xưa nghĩ gì" sau 1–2 năm |

**Scenario:** Minh đang ôn thi cuối kỳ, cảm thấy stress. Anh mở Setlog, ghi nhật ký hôm nay kèm mood "lo lắng", rồi tạo một Time Capsule gửi cho bản thân sau 6 tháng khi đã tốt nghiệp.

---

### Persona 2 — Linh (26 tuổi, Nhân viên văn phòng)

| Thuộc tính | Chi tiết |
|:-----------|:---------|
| **Nghề nghiệp** | Marketing Executive |
| **Mục tiêu** | Theo dõi cân bằng cảm xúc, tránh burnout |
| **Nỗi đau** | Cuộc sống bận rộn khiến cô không có thời gian phản tư |
| **Thiết bị** | iPhone + MacBook |
| **Động lực dùng Setlog** | Muốn xem biểu đồ mood 30 ngày để hiểu chu kỳ cảm xúc |

**Scenario:** Mỗi tối trước khi ngủ, Linh dành 2 phút check-in mood trên Setlog. Cuối tháng, cô xem biểu đồ xu hướng và nhận ra những ngày cuối tuần cô luôn vui hơn — giúp cô lên kế hoạch nghỉ ngơi hợp lý hơn.

---

### Persona 3 — Nhóm bạn thân (4 người, 20–22 tuổi)

| Thuộc tính | Chi tiết |
|:-----------|:---------|
| **Bối cảnh** | Nhóm bạn đại học học khác trường, muốn duy trì kết nối |
| **Mục tiêu** | Có không gian chung để chia sẻ khoảnh khắc hàng ngày |
| **Nỗi đau** | Chat nhóm Messenger quá ồn ào, thiếu chiều sâu |
| **Động lực dùng Setlog** | Group Feed + Group Check-in để "điểm danh" mỗi ngày |

**Scenario:** Mỗi tối 9h, nhóm nhận thông báo check-in. Ai online sẽ chụp ảnh tức thì từ camera, broadcast lên feed nhóm — tạo cảm giác kết nối dù ở xa nhau.

---

## User Stories (MVP)

### Auth
- `US-01` Là **Guest**, tôi muốn **đăng ký tài khoản** để **lưu nhật ký của mình**.
- `US-02` Là **Guest**, tôi muốn **đăng nhập** để **truy cập dữ liệu cá nhân**.

### Core Journal
- `US-03` Là **User**, tôi muốn **tạo bài nhật ký mới với ảnh** để **lưu lại khoảnh khắc**.
- `US-04` Là **User**, tôi muốn **xem nhật ký theo timeline** để **dễ dàng nhìn lại quá khứ**.
- `US-05` Là **User**, tôi muốn **gắn tag và tìm kiếm nhật ký** để **tìm lại bài viết nhanh**.

### Time Capsule
- `US-06` Là **User**, tôi muốn **tạo Time Capsule có hẹn giờ mở** để **gửi thư cho bản thân tương lai**.
- `US-07` Là **User**, tôi muốn **nhận thông báo khi capsule mở** để **không bỏ lỡ khoảnh khắc**.
- `US-08` Là **User**, tôi muốn **gửi capsule cho người khác** để **chia sẻ ký ức với bạn bè**.

### Mood Tracking
- `US-09` Là **User**, tôi muốn **ghi lại mood mỗi ngày** để **theo dõi cảm xúc theo thời gian**.
- `US-10` Là **User**, tôi muốn **xem biểu đồ mood 30 ngày** để **hiểu chu kỳ cảm xúc của mình**.
- `US-11` Là **User**, tôi muốn **xem lại "Ngày này năm xưa"** để **kết nối với ký ức cũ**.

### Group Check-in
- `US-12` Là **User**, tôi muốn **tạo phiên check-in nhóm** để **kết nối với bạn bè real-time**.
- `US-13` Là **User**, tôi muốn **chụp ảnh check-in từ camera** để **chia sẻ khoảnh khắc tức thì**.
