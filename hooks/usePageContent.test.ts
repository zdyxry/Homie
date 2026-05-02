import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePageContent } from './usePageContent';

vi.mock('~/utils/content-extractor', () => ({
  extractPageContent: vi.fn(),
}));

import { extractPageContent } from '~/utils/content-extractor';

describe('usePageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null content', () => {
    const { result } = renderHook(() => usePageContent());
    expect(result.current.pageContent).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should extract page content', async () => {
    const mockContent = {
      title: 'Test Page',
      content: '<p>Hello</p>',
      textContent: 'Hello',
      length: 5,
      excerpt: 'Hello',
    };
    vi.mocked(extractPageContent).mockResolvedValue(mockContent);

    const { result } = renderHook(() => usePageContent());

    let extracted: typeof mockContent | null = null;
    await act(async () => {
      extracted = await result.current.extract();
    });

    expect(extracted).toEqual(mockContent);
    expect(result.current.pageContent).toEqual(mockContent);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set error on extraction failure', async () => {
    vi.mocked(extractPageContent).mockRejectedValue(new Error('Extraction failed'));

    const { result } = renderHook(() => usePageContent());

    await act(async () => {
      await result.current.extract();
    });

    expect(result.current.error).toBe('Extraction failed');
    expect(result.current.pageContent).toBeNull();
  });

  it('should clear state', async () => {
    const mockContent = {
      title: 'Test Page',
      content: '<p>Hello</p>',
      textContent: 'Hello',
      length: 5,
      excerpt: 'Hello',
    };
    vi.mocked(extractPageContent).mockResolvedValue(mockContent);

    const { result } = renderHook(() => usePageContent());

    await act(async () => {
      await result.current.extract();
    });

    expect(result.current.pageContent).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.pageContent).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
