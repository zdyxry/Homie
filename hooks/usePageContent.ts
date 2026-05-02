import { useState, useRef, useCallback } from 'react';
import { extractPageContent, type PageContent } from '~/utils/content-extractor';

interface UsePageContentReturn {
  pageContent: PageContent | null;
  isLoading: boolean;
  error: string | null;
  extract: () => Promise<PageContent | null>;
  clear: () => void;
}

export function usePageContent(): UsePageContentReturn {
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cachedContentRef = useRef<PageContent | null>(null);
  const cachedUrlRef = useRef<string>('');

  const extract = useCallback(async (): Promise<PageContent | null> => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Return cached content if URL hasn't changed
    if (cachedUrlRef.current === currentUrl && cachedContentRef.current) {
      setPageContent(cachedContentRef.current);
      return cachedContentRef.current;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await extractPageContent();
      if (content) {
        setPageContent(content);
        cachedContentRef.current = content;
        cachedUrlRef.current = currentUrl;
        return content;
      } else {
        setError('Failed to extract page content');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setPageContent(null);
    setError(null);
    cachedContentRef.current = null;
    cachedUrlRef.current = '';
  }, []);

  return { pageContent, isLoading, error, extract, clear };
}
