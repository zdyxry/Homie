import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoScroll } from './useAutoScroll';

describe('useAutoScroll', () => {
  it('should initialize with autoScroll enabled', () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(result.current.autoScroll).toBe(true);
  });

  it('should provide refs', () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(result.current.contentRef.current).toBeNull();
    expect(result.current.messagesEndRef.current).toBeNull();
  });

  it('should provide scrollToBottom function', () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(typeof result.current.scrollToBottom).toBe('function');
  });
});
