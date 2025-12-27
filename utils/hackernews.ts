/**
 * HackerNews 相关工具函数
 */

export interface HackerNewsStory {
  objectID: string;
  title: string;
  url: string;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
}

export interface HackerNewsSearchResult {
  hits: HackerNewsStory[];
  nbHits: number;
}

export interface HackerNewsComment {
  id: number;
  created_at: string;
  author: string;
  text: string;
  points: number | null;
  children: HackerNewsComment[];
}

export interface HackerNewsItem {
  id: number;
  created_at: string;
  author: string;
  title: string;
  url: string;
  text: string;
  points: number;
  children: HackerNewsComment[];
}

/**
 * 从 URL 中移除 UTM 参数
 */
export function removeUtmParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    // 移除所有 utm 相关参数
    const utmKeys = Array.from(params.keys()).filter(key =>
      key.toLowerCase().startsWith('utm_')
    );

    utmKeys.forEach(key => params.delete(key));

    // 重新构建 URL
    urlObj.search = params.toString();
    return urlObj.toString();
  } catch (error) {
    console.error('Failed to parse URL:', error);
    return url;
  }
}

/**
 * 在 HackerNews 上搜索指定 URL 的讨论
 */
export async function searchHackerNews(url: string): Promise<HackerNewsSearchResult | null> {
  try {
    // 清理 URL（移除 UTM 参数和尾部斜杠）
    const cleanUrl = removeUtmParams(url).replace(/\/$/, '');

    // 使用 HackerNews Algolia API 搜索
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(cleanUrl)}&tags=story`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`HackerNews API request failed: ${response.statusText}`);
    }

    const data: HackerNewsSearchResult = await response.json();

    return data;
  } catch (error) {
    console.error('Failed to search HackerNews:', error);
    return null;
  }
}

/**
 * 获取 HackerNews 讨论链接
 */
export function getHackerNewsDiscussionUrl(storyId: string): string {
  return `https://news.ycombinator.com/item?id=${storyId}`;
}

/**
 * 搜索当前页面的 HackerNews 讨论
 */
export async function findHackerNewsDiscussion(pageUrl: string) {
  const result = await searchHackerNews(pageUrl);

  if (!result || result.hits.length === 0) {
    return null;
  }

  // 返回第一个结果（通常是最相关的）
  const topStory = result.hits[0];

  return {
    storyId: topStory.objectID,
    title: topStory.title,
    discussionUrl: getHackerNewsDiscussionUrl(topStory.objectID),
    points: topStory.points,
    numComments: topStory.num_comments,
    author: topStory.author,
    createdAt: topStory.created_at,
  };
}

/**
 * 从 HackerNews API 获取完整的讨论树
 */
export async function fetchHackerNewsComments(storyId: string): Promise<HackerNewsItem | null> {
  try {
    const apiUrl = `https://hn.algolia.com/api/v1/items/${storyId}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HackerNews API request failed: ${response.statusText}`);
    }

    const data: HackerNewsItem = await response.json();

    return data;
  } catch (error) {
    console.error('Failed to fetch HackerNews comments:', error);
    return null;
  }
}

/**
 * 将评论树格式化为可读的文本格式
 */
function formatCommentsToText(comments: HackerNewsComment[], depth: number = 0): string {
  let text = '';

  for (const comment of comments) {
    const indent = '  '.repeat(depth);
    const cleanText = comment.text
      ?.replace(/<p>/g, '\n\n')
      .replace(/<\/p>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&') || '';

    text += `${indent}[${comment.author}]:\n${indent}${cleanText}\n\n`;

    if (comment.children && comment.children.length > 0) {
      text += formatCommentsToText(comment.children, depth + 1);
    }
  }

  return text;
}

/**
 * 获取 HackerNews 讨论的完整文本内容（用于 AI 分析）
 */
export async function getHackerNewsDiscussionText(storyId: string, originalUrl?: string): Promise<string | null> {
  try {
    const item = await fetchHackerNewsComments(storyId);

    if (!item) {
      return null;
    }

    let discussionText = `标题: ${item.title}\n`;
    discussionText += `作者: ${item.author}\n`;
    discussionText += `分数: ${item.points} points\n`;
    if (originalUrl) {
      discussionText += `原文链接: ${originalUrl}\n`;
    }
    if (item.url) {
      discussionText += `HackerNews 链接: ${item.url}\n`;
    }
    discussionText += `\n评论区:\n\n`;

    if (item.children && item.children.length > 0) {
      discussionText += formatCommentsToText(item.children);
    } else {
      discussionText += '暂无评论\n';
    }

    return discussionText;
  } catch (error) {
    console.error('Failed to get discussion text:', error);
    return null;
  }
}
