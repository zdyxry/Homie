import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchHackerNews, findHackerNewsDiscussion, fetchHackerNewsComments } from './hackernews';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('hackernews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search stories by URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        hits: [
          {
            objectID: '123',
            title: 'Test Story',
            url: 'https://example.com/article',
            points: 100,
            num_comments: 50,
            author: 'testuser',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      }),
    });

    const result = await searchHackerNews('https://example.com/article');
    expect(result?.hits).toHaveLength(1);
    expect(result?.hits[0].objectID).toBe('123');
  });

  it('should find discussion for page URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        hits: [
          {
            objectID: '123',
            title: 'Test Story',
            url: 'https://example.com/article',
            points: 100,
            num_comments: 50,
            author: 'testuser',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      }),
    });

    const result = await findHackerNewsDiscussion('https://example.com/article?utm_source=feed');
    expect(result).not.toBeNull();
    expect(result?.storyId).toBe('123');
  });

  it('should return null when no discussion found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ hits: [] }),
    });

    const result = await findHackerNewsDiscussion('https://unknown.com');
    expect(result).toBeNull();
  });

  it('should fetch comments recursively', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          title: 'Test',
          author: 'author',
          text: '<p>Story text</p>',
          points: 100,
          children: [
            {
              id: 456,
              author: 'commenter',
              text: '<p>Nice post</p>',
              points: 5,
              children: [],
            },
          ],
        }),
      });

    const item = await fetchHackerNewsComments('123');
    expect(item?.children).toHaveLength(1);
    expect(item?.children[0].text).toBe('<p>Nice post</p>');
  });
});
