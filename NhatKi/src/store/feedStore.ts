import { create } from "zustand";

export interface FeedItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  imageUrl: string;
  emotion: string | null;
  location: string | null;
  commentsCount: number;
  reactionsCount: number;
  createdAt: string;
}

interface FeedState {
  feeds: FeedItem[];
  isLoading: boolean;
  setFeeds: (feeds: FeedItem[]) => void;
  addFeed: (feed: FeedItem) => void;
  setLoading: (loading: boolean) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feeds: [],
  isLoading: false,
  setFeeds: (feeds) => set({ feeds }),
  addFeed: (feed) => set((state) => ({ feeds: [feed, ...state.feeds] })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
