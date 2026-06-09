import { apiService } from "./api.service.ts";
export const feedApi = {
  // Lấy danh sách bài viết phân trang của nhóm
  getGroupFeeds: async (page: number = 1, limit: number = 10) => {
    const response = await apiService.get(`/feed/group`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Gửi lệnh tương tác cảm xúc lên bài viết
  sendReaction: async (feedId: string, type: string) => {
    const response = await apiService.post(`/feed/${feedId}/reaction`, {
      type,
    });
    return response.data;
  },
};
