import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHackerNews } from './useHackerNews';

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
    },
  },
}));

import browser from 'webextension-polyfill';

describe('useHackerNews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null discussion', () => {
    const { result } = renderHook(() => useHackerNews());
    expect(result.current.discussion).toBeNull();
    // isSearching becomes true immediately on mount due to automatic search
    expect(result.current.isSearching).toBe(true);
  });

  it('should search and find discussion on mount', async () => {
    const mockDiscussion = {
      storyId: '123',
      title: 'Test Story',
      discussionUrl: 'https://news.ycombinator.com/item?id=123',
      points: 100,
      numComments: 50,
      author: 'testuser',
      createdAt: '2024-01-01',
    };

    vi.mocked(browser.runtime.sendMessage)
      .mockResolvedValueOnce({ url: 'https://example.com' })
      .mockResolvedValueOnce({ success: true, discussion: mockDiscussion });

    const { result } = renderHook(() => useHackerNews());

    await waitFor(() => expect(result.current.isSearching).toBe(false));

    expect(result.current.discussion).toEqual(mockDiscussion);
    expect(result.current.currentUrl).toBe('https://example.com');
  });

  it('should fetch discussion text for analysis', async () => {
    const mockDiscussion = {
      storyId: '123',
      title: 'Test Story',
      discussionUrl: 'https://news.ycombinator.com/item?id=123',
      points: 100,
      numComments: 50,
      author: 'testuser',
      createdAt: '2024-01-01',
    };

    vi.mocked(browser.runtime.sendMessage)
      .mockResolvedValueOnce({ url: 'https://example.com' })
      .mockResolvedValueOnce({ success: true, discussion: mockDiscussion })
      .mockResolvedValueOnce({ success: true, discussionText: 'Comment 1\nComment 2' });

    const { result } = renderHook(() => useHackerNews());

    await waitFor(() => expect(result.current.discussion).not.toBeNull());

    const text = await result.current.analyzeDiscussion('https://example.com');
    expect(text).toBe('Comment 1\nComment 2');
  });
});
