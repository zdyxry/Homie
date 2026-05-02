import { create } from 'zustand';
import browser from 'webextension-polyfill';
import { RuntimeMessages } from '~/utils/messages';

export interface HackerNewsDiscussion {
  storyId: string;
  title: string;
  discussionUrl: string;
  points: number;
  numComments: number;
  author: string;
  createdAt: string;
}

interface HNState {
  discussion: HackerNewsDiscussion | null;
  isSearching: boolean;
  currentUrl: string;
  search: () => Promise<void>;
  fetchDiscussionText: () => Promise<string | null>;
}

export const useHNStore = create<HNState>((set, get) => ({
  discussion: null,
  isSearching: false,
  currentUrl: '',

  search: async () => {
    set({ isSearching: true });
    try {
      const response = await browser.runtime.sendMessage({
        type: RuntimeMessages.GET_TAB_INFO,
      }) as { url: string };

      if (response?.url) {
        set({ currentUrl: response.url });

        const hnResponse = await browser.runtime.sendMessage({
          type: RuntimeMessages.SEARCH_HACKERNEWS,
          payload: response.url,
        }) as { success: boolean; discussion: HackerNewsDiscussion };

        if (hnResponse?.success && hnResponse.discussion) {
          set({ discussion: hnResponse.discussion });
        }
      }
    } catch (error) {
      console.error('Failed to search HackerNews:', error);
    } finally {
      set({ isSearching: false });
    }
  },

  fetchDiscussionText: async () => {
    const { discussion, currentUrl } = get();
    if (!discussion) return null;

    try {
      const response = await browser.runtime.sendMessage({
        type: RuntimeMessages.FETCH_HACKERNEWS_COMMENTS,
        payload: {
          storyId: discussion.storyId,
          originalUrl: currentUrl,
        },
      }) as { success: boolean; discussionText: string };

      return response?.success ? response.discussionText : null;
    } catch (error) {
      console.error('Failed to fetch HackerNews comments:', error);
      return null;
    }
  },
}));
