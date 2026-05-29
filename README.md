# Personal Memory & Emotional Timeline System

> Your life, organized. Your memories, preserved. Your emotions, understood.

---

## Tổng quan dự án (Overview)

Đây là một ứng dụng nhật ký cá nhân (Personal Diary App) kết hợp quản lý ký ức và cảm xúc người dùng. 
Ứng dụng cho phép người dùng ghi lại nhật ký hằng ngày, đính kèm media, theo dõi cảm xúc (mood) và tạo **Time Capsule** – nơi lưu trữ ký ức để mở trong tương lai.

Dự án hướng tới việc xây dựng một hệ thống **Personal Memory Timeline**, giúp người dùng không chỉ ghi lại cuộc sống mà còn theo dõi cảm xúc và trải nghiệm theo thời gian.

---

## Mục tiêu dự án

*  Xây dựng hệ thống nhật ký cá nhân đơn giản, dễ sử dụng.
*  Hỗ trợ lưu trữ nội dung đa phương tiện (ảnh, video).
*  Tổ chức dữ liệu theo dòng thời gian (timeline).
*  Tích hợp tính năng Time Capsule để lưu ký ức tương lai.
*  Theo dõi trạng thái cảm xúc người dùng theo thời gian.

---

##  Phân rã tính năng (Features Breakdown)

### 1. MVP – Các tính năng cốt lõi (Core Features)
* **Tài khoản:** Đăng ký / Đăng nhập người dùng.
* **Quản lý nhật ký:** Tạo, chỉnh sửa nhật ký; Xóa / khôi phục bài viết.
* **Hiển thị:** Xem nhật ký theo timeline (sắp xếp trực quan theo ngày).
* **Quyền riêng tư:** Phân quyền riêng tư bài viết (public/private).
* **Tiện ích mở rộng:** 
  * Đính kèm ảnh & media.
  * Gắn thẻ (tags) cho bài viết và tìm kiếm nhật ký.
  * Nhắc nhở viết nhật ký hằng ngày.
  * Xuất dữ liệu nhật ký.

### 2. Các tính năng nâng cao (Advanced Features)

####  Hộp thư thời gian (Time Capsule)
* Tạo Time Capsule lưu ký ức và khóa nội dung trong một khoảng thời gian thiết lập.
* Đồng hồ hiển thị đếm ngược đến thời điểm mở.
* Mở và xem lại nội dung khi đến hạn.
* Gửi Time Capsule cho người dùng khác trong hệ thống.

####  Theo dõi tâm trạng (Mood Tracking)
* Chọn trạng thái cảm xúc hằng ngày và lưu lại lịch sử cảm xúc.
* Xem biểu đồ thống kê, theo dõi mood biến động theo thời gian.
* Hệ thống gợi ý nội dung dựa trên cảm xúc hiện tại.
* Nhắc lại ký ức cũ (Tính năng *On This Day* - Ngày này năm xưa).

### 3. Hệ thống quản trị (Admin Panel)
* Quản lý thông tin và trạng thái người dùng.
* Kiểm duyệt các nội dung báo cáo vi phạm.
* Dashboard hiển thị số liệu thống kê toàn bộ hệ thống.
* Cấu hình hệ thống, thiết lập tự động Backup & Restore dữ liệu.

---

## Ý tưởng cốt lõi của hệ thống

Hệ thống được thiết kế và phát triển tập trung xoay quanh mô hình: 
**Personal Memory + Emotional Timeline System**, kết hợp chặt chẽ giữa 3 yếu tố trọng tâm:

```text
       ┌─────────────────────────────────────────────┐
       │             NHẬT KÝ CÁ NHÂN                 │
       └──────────────────────┬──────────────────────┘
                              ▼
       ┌──────────────────────┴──────────────────────┐
       │  CẢM XÚC NGƯỜI DÙNG  │   KÝ ỨC TƯƠNG LAI     │
       │   (Mood Tracking)    │   (Time Capsule)      │
       └──────────────────────┴──────────────────────┘

---

##  Kiến trúc đề xuất (Tech Stack)

| Thành phần   | Công nghệ đề xuất                      |
| :----------- | :------------------------------------- |
| **Frontend** | React / Web App / Mobile App (Android) |
| **Backend**  | RESTful API                            |
| **Database** | MySQL / MongoDB                        |
| **Storage**  | Cloud Storage (Lưu trữ hình ảnh/video) |

## Kết luận

Đây không chỉ là một ứng dụng nhật ký thông thường, mà là một hệ thống lưu trữ ký ức và cảm xúc toàn diện theo thời gian, giúp người dùng hiểu rõ và kết nối sâu sắc hơn với chính mình thông qua các dữ liệu cuộc sống hằng ngày.
