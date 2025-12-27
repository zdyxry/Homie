// Page content extractor using Readability
import { Readability } from '@mozilla/readability';

export interface PageContent {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  siteName?: string;
}

export async function extractPageContent(): Promise<PageContent | null> {
  try {
    // Clone the document to avoid modifying the original
    const documentClone = document.cloneNode(true) as Document;

    // Use Readability to extract main content
    const reader = new Readability(documentClone, {
      charThreshold: 500,
    });

    const article = reader.parse();

    if (!article) {
      return null;
    }

    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      siteName: article.siteName || undefined,
    };
  } catch (error) {
    console.error('Error extracting page content:', error);
    return null;
  }
}

export function getSelectedText(): string {
  const selection = window.getSelection();
  return selection?.toString().trim() || '';
}

export function getPageMetadata() {
  return {
    title: document.title,
    url: window.location.href,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
    author: document.querySelector('meta[name="author"]')?.getAttribute('content') || '',
  };
}
