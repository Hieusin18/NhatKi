<div align="center">

# 📸 SetLog

**Mạng xã hội chia sẻ video ngắn theo phòng nhóm — ghi lại khoảnh khắc mỗi giờ, tự động ghép thành nhật ký video (daily vlog).**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Expo](https://img.shields.io/badge/Expo-51-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)](#license)

[Giới thiệu](#-giới-thiệu) •
[Tính năng](#-tính-năng-chính) •
[Kiến trúc](#-kiến-trúc--tech-stack) •
[Cài đặt](#-cài-đặt--chạy-dự-án) •
[Cấu trúc thư mục](#-cấu-trúc-thư-mục) •
[Đóng góp](#-đóng-góp)

</div>

---

## 📖 Giới thiệu

**SetLog** là ứng dụng mạng xã hội cho phép người dùng tạo hoặc tham gia **phòng nhóm tối đa 12 thành viên** (join qua mã PIN), ghi lại khoảnh khắc bằng **camera kép** (quay đồng thời camera trước và sau) theo các khung giờ nhắc trong ngày, và tự động tổng hợp các khoảnh khắc đó thành một **video nhật ký (daily vlog)**.

Dự án gồm 3 thành phần: **Web App**, **Mobile App (Expo)**, và **Backend Functions (Firebase)**.

## 📚 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc & Tech Stack](#-kiến-trúc--tech-stack)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [Biến môi trường](#-biến-môi-trường)
- [Scripts](#-scripts)
- [Trạng thái phát triển](#-trạng-thái-phát-triển)
- [Đóng góp](#-đóng-góp)
- [License](#license)

---

## ✨ Tính năng chính

| Nhóm | Mô tả |
|---|---|
| 🔐 **Xác thực** | Đăng ký / đăng nhập người dùng qua Firebase Auth |
| 🏠 **Phòng nhóm (Log Room)** | Tạo phòng, tham gia bằng **mã PIN**, giới hạn tối đa **12 thành viên/phòng** |
| 🎥 **Dual Camera Capture** | Quay video/ảnh đồng thời camera trước & sau theo khung giờ nhắc (daily prompt); ghi nhận số phút trễ (`lateMinutes`) và số lần quay lại (`retakeCount`) |
| 🧾 **Feed & tương tác** | Reaction emoji, reaction bằng ảnh selfie, bình luận, xem danh sách người đã xem bài đăng (seen-by) |
| 👥 **Quản lý bạn bè** | Gửi/nhận lời mời kết bạn, danh sách bạn thân (close friends), chặn người dùng |
| 💬 **Chat** | Nhắn tin trực tiếp giữa các thành viên |
| 🗂️ **Memories** | Xem lại các khoảnh khắc/video đã lưu theo dòng thời gian |
| 🎬 **Vlog Player** | Ghép và phát lại các clip trong ngày thành một video tổng hợp |
| 🔒 **Quyền riêng tư** | Theo từng bài đăng: `public_friends` / `close_friends` / `private` |
| 🔔 **Thông báo** | Nhắc giờ ghi hình, lời mời kết bạn, reaction, bình luận, cảnh báo trễ giờ |

---

## 🏗️ Kiến trúc & Tech Stack

<div align="center">

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│           WEB APP            │        │          MOBILE APP           │
│  React 19 · TypeScript       │        │   Expo · React Native 0.74    │
│  Vite · Tailwind CSS         │        │   TypeScript                  │
│  Express (server-side)       │        │                                │
└───────────────┬──────────────┘        └────────────────┬───────────────┘
                │                                          │
                └───────────────────┬──────────────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │  FIREBASE (Auth · Firestore)   │
                     │  Cloud Functions               │
                     └───────────────┬─────────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │  AWS S3 (media storage)         │
                     │  Sharp (image processing)       │
                     └───────────────────────────────┘
```

</div>

| Thành phần | Công nghệ |
|---|---|
| **Web App** | React 19, TypeScript, Vite 6, Tailwind CSS, Express |
| **Mobile App** | Expo 51, React Native 0.74, TypeScript |
| **Backend / API** | Firebase Cloud Functions |
| **Xác thực & Database** | Firebase Auth, Firestore |
| **Lưu trữ media** | AWS S3 (`@aws-sdk/client-s3`), xử lý ảnh bằng Sharp |
| **AI** | Google Gemini API (`@google/genai`) |

---

## 📁 Cấu trúc thư mục

```
setlog/
├── src/                          # Web App
│   ├── components/
│   │   ├── AuthModal.tsx             # Đăng nhập / đăng ký
│   │   ├── DualCameraCapture.tsx     # Quay video 2 camera đồng thời
│   │   ├── FeedAndInteractions.tsx   # Feed, reaction, comment, seen-by
│   │   ├── FriendsManager.tsx        # Quản lý bạn bè
│   │   ├── ChatView.tsx              # Nhắn tin
│   │   ├── MemoriesView.tsx          # Xem lại ký ức
│   │   ├── BottomTabs.tsx
│   │   └── NavigationHeader.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   └── mediaService.ts           # Upload / xử lý media
│   ├── lib/firebase.ts
│   ├── types.ts                      # MomentPost, UserProfile, FriendRequest, ...
│   ├── App.tsx
│   └── main.tsx
│
├── react-native-setlog/          # Mobile App (Expo)
│   └── src/
│       ├── screens/
│       │   ├── AuthScreen.tsx
│       │   ├── HomeScreen.tsx
│       │   ├── CameraScreen.tsx
│       │   ├── LogDetailScreen.tsx
│       │   └── VlogPlayerScreen.tsx
│       ├── navigation/AppNavigator.tsx
│       ├── context/AppContext.tsx
│       └── lib/firebase.ts
│
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       └── joinRoomByPin.ts          # Tham gia phòng qua mã PIN (giới hạn 12 thành viên)
│
├── server.ts                     # Express server (production)
├── .env.example
└── package.json
```

---

## ⚙️ Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) ≥ 18
- Tài khoản [Firebase](https://firebase.google.com/) (Authentication + Firestore + Cloud Functions)
- Tài khoản [AWS S3](https://aws.amazon.com/s3/) *(tùy chọn, nếu dùng lưu trữ media qua S3)*
- [Expo CLI](https://docs.expo.dev/get-started/installation/) *(để chạy Mobile App)*

---

## 🚀 Cài đặt & Chạy dự án

### 1. Clone repository

```bash
git clone https://github.com/Hieusin18/NhatKi.git
cd NhatKi
```

### 2. Web App

```bash
npm install
cp .env.example .env.local   # điền các biến môi trường thật
npm run dev
```

Build & chạy production:

```bash
npm run build
npm start
```

### 3. Mobile App (Expo)

```bash
cd react-native-setlog
npm install
npm start          # hoặc: npm run android / npm run ios / npm run web
```

---

## 🔑 Biến môi trường

Tạo file `.env.local` ở thư mục gốc dựa theo `.env.example`:

```env
GEMINI_API_KEY=              # API key cho Google Gemini
APP_URL=                     # URL nơi ứng dụng được host
FIREBASE_STORAGE_BUCKET=     # Firebase Storage bucket
FIREBASE_MESSAGING_SENDER_ID=
FCM_SERVER_KEY=              # (tùy chọn) cho notification backend
```

> ⚠️ Không commit file `.env.local` lên repository. File này đã được liệt kê trong `.gitignore`.

---

## 📜 Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy server phát triển (Vite + Express qua `tsx`) |
| `npm run build` | Build web app + bundle server production |
| `npm start` | Chạy bản build production |
| `npm run preview` | Preview bản build Vite |
| `npm run lint` | Kiểm tra type bằng `tsc --noEmit` |
| `npm run clean` | Xóa thư mục `dist` |

---

## 🛣️ Trạng thái phát triển

Dự án đang trong giai đoạn **MVP**, tập trung hoàn thiện các luồng:

- [x] Xác thực người dùng
- [x] Tạo / tham gia phòng nhóm qua mã PIN
- [x] Quay video dual-camera theo khung giờ
- [x] Feed, reaction, bình luận, seen-by
- [x] Quản lý bạn bè & chat
- [ ] Ghép & phát vlog tổng hợp cuối ngày (hoàn thiện)
- [ ] Hệ thống thông báo đẩy (push notification) đầy đủ

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo nhánh feature: `git checkout -b feature/ten-tinh-nang`
3. Commit thay đổi: `git commit -m "feat: mô tả ngắn gọn"`
4. Push lên nhánh: `git push origin feature/ten-tinh-nang`
5. Mở Pull Request

## License

Dự án phục vụ mục đích học tập / báo cáo môn học. *(Cập nhật lại mục này nếu nhóm chọn giấy phép mã nguồn mở cụ thể, ví dụ MIT.)*
