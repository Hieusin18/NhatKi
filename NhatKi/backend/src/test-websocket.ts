import { Server } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" }
});

// Giả lập Memory Cache lưu trạng thái online (Nhiệm vụ 3)
const onlineCache = new Map<string, Set<string>>();

// 1. Middleware Xác thực & Phân loại Người dùng dựa trên Token từ HTML (Nhiệm vụ 1)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  // Trường hợp 1: Chọn User A trên giao diện HTML
  if (token === "VALID_TOKEN_USER_A_GROUP_1") {
    socket.data.userId = "User_A_Nhom_1";
    socket.data.groupId = "group_cnpm_04"; // Ở chung phòng để kiểm tra tương tác
    return next();
  }

  // Trường hợp 2: Chọn User B trên giao diện HTML
  if (token === "VALID_TOKEN_USER_B_GROUP_1") {
    socket.data.userId = "User_B_Nhom_1";
    socket.data.groupId = "group_cnpm_04"; // Ở chung phòng để kiểm tra tương tác
    return next();
  }

  // Trường hợp 3: Chọn User C trên giao diện HTML
  if (token === "VALID_TOKEN_USER_C_GROUP_2") {
    socket.data.userId = "User_C_Nhom_2";
    socket.data.groupId = "group_khac_999"; // Phòng khác để kiểm tra cách ly bảo mật
    return next();
  }

  // Trường hợp đặc biệt: Giữ cấu hình cho Token tự động dài ngoằn của máy bạn (nếu có dùng lại)
  if (token && token.startsWith("eyJhbGci")) {
    socket.data.userId = "user_dev2_99";
    socket.data.groupId = "group_cnpm_04";
    return next();
  }

  // Các trường hợp token hết hạn, sai cấu trúc hoặc không truyền token
  console.log(`[Socket Error] Auth failed: Token không hợp lệ hoặc trống.`);
  return next(new Error("Authentication error"));
});

io.on("connection", (socket) => {
  const { userId, groupId } = socket.data;

  // Phân phòng nhóm (Nhiệm vụ 1)
  socket.join(groupId);
  console.log(`[💡 SERVER LOG] User ${userId} đã kết nối và vào phòng ${groupId}`);

  // Cập nhật trạng thái Online (Nhiệm vụ 3)
  if (!onlineCache.has(userId)) {
    onlineCache.set(userId, new Set());
    // Thiết bị đầu tiên kết nối -> Phát thông báo Presence Online cho các thành viên khác trong phòng
    socket.to(groupId).emit("presence", { userId, status: "online" });
  }
  onlineCache.get(userId)!.add(socket.id);

  // Trả về danh sách online cho riêng client vừa mới kết nối vào
  socket.emit("online-list", Array.from(onlineCache.keys()));

  // 2. Lắng nghe phát ảnh chụp (Nhiệm vụ 2)
  socket.on("share-capture", (data) => {
    const payload = {
      groupId: groupId,
      imageId: data.imageId,
      senderId: userId,
      imageUrl: data.imageUrl,
      createdAt: new Date().toISOString()
    };
    // Broadcast chuẩn chỉ trong phòng nhóm (Cách ly bảo mật giữa các nhóm)
    io.to(groupId).emit("new-capture", payload);
    console.log(`[📸 BROADCAST] Ảnh mới từ ${userId} gửi tới phòng ${groupId}`);
  });

  // Xử lý mất mạng/ngắt kết nối đa thiết bị (Nhiệm vụ 3)
  socket.on("disconnect", () => {
    const userConnections = onlineCache.get(userId);
    if (userConnections) {
      userConnections.delete(socket.id); // Xóa bớt 1 định danh thiết bị vừa ngắt

      // Chỉ khi TẤT CẢ các thiết bị/tab của user này ngắt hẳn hoàn toàn thì mới báo offline
      if (userConnections.size === 0) {
        onlineCache.delete(userId);
        io.to(groupId).emit("presence", { userId, status: "offline" });
        console.log(`[🔴 SERVER LOG] User ${userId} đã offline hoàn toàn.`);
      } else {
        console.log(`[💡 SERVER LOG] User ${userId} đóng 1 thiết bị, vẫn còn thiết bị khác online.`);
      }
    }
  });
});

// Chạy đúng port 5000 mà file client đang tìm kiếm
server.listen(5000, () => {
  console.log("🚀 LĂNG NGHE: WebSocket Server Test đang chạy tại port 5000...");
});