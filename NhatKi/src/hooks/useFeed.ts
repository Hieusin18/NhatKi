import { useState, useEffect } from "react";
import { useFeedStore } from "../store/feedStore";
import { feedApi } from "../services/feed.api";

export const useFeed = () => {
  const { feeds, setFeeds, isLoading, setLoading } = useFeedStore();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeeds = async (isRefresh = false) => {
    if (isLoading) return;
    try {
      setLoading(true);
      const currentPage = isRefresh ? 1 : page;
      const data = await feedApi.getGroupFeeds(currentPage);

      if (data.length < 10) {
        setHasMore(false);
      }

      if (isRefresh) {
        setFeeds(data);
        setPage(2);
        setHasMore(true);
      } else {
        setFeeds([...feeds, ...data]);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Lỗi lấy bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds(true);
  }, []);

  return {
    feeds,
    isLoading,
    hasMore,
    refreshFeeds: () => fetchFeeds(true), // Kéo xuống để refresh làm mới bài đăng
    loadMoreFeeds: () => {
      if (hasMore) fetchFeeds();
    }, // Cuộn xuống đáy để tải tiếp bài cũ
  };
};
