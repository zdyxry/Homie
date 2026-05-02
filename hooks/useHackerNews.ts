import { useState, useEffect, useCallback } from 'react';
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

interface UseHackerNewsReturn {
  discussion: HackerNewsDiscussion | null;
  isSearching: boolean;
  currentUrl: string;
  search: () => Promise<void>;
  analyzeDiscussion: (originalUrl: string) => Promise<string | null>;
}

export function useHackerNews(): UseHackerNewsReturn {
  const [discussion, setDiscussion] = useState<HackerNewsDiscussion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const search = useCallback(async () => {
    try {
      setIsSearching(true);

      const response = await browser.runtime.sendMessage({
        type: RuntimeMessages.GET_TAB_INFO,
      }) as { url: string };

      if (response?.url) {
        setCurrentUrl(response.url);

        const hnResponse = await browser.runtime.sendMessage({
          type: RuntimeMessages.SEARCH_HACKERNEWS,
          payload: response.url,
        }) as { success: boolean; discussion: HackerNewsDiscussion };

        if (hnResponse?.success && hnResponse.discussion) {
          setDiscussion(hnResponse.discussion);
        }
      }
    } catch (error) {
      console.error('Failed to search HackerNews:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const analyzeDiscussion = useCallback(async (originalUrl: string): Promise<string | null> => {
    if (!discussion) return null;

    try {
      const response = await browser.runtime.sendMessage({
        type: RuntimeMessages.FETCH_HACKERNEWS_COMMENTS,
        payload: {
          storyId: discussion.storyId,
          originalUrl,
        },
      }) as { success: boolean; discussionText: string };

      if (response?.success && response.discussionText) {
        return response.discussionText;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch HackerNews comments:', error);
      return null;
    }
  }, [discussion]);

  useEffect(() => {
    search();
  }, [search]);

  return { discussion, isSearching, currentUrl, search, analyzeDiscussion };
}
