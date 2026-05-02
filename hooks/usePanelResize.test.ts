import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanelResize } from './usePanelResize';

describe('usePanelResize', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1200);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with default width', () => {
    const { result } = renderHook(() => usePanelResize());
    expect(result.current.width).toBe(600);
    expect(result.current.isResizing).toBe(false);
  });

  it('should initialize with custom width', () => {
    const { result } = renderHook(() => usePanelResize({ initialWidth: 500 }));
    expect(result.current.width).toBe(500);
  });

  it('should start resizing', () => {
    const { result } = renderHook(() => usePanelResize());
    act(() => {
      result.current.startResizing();
    });
    expect(result.current.isResizing).toBe(true);
  });

  it('should update width on mouse move', () => {
    const { result } = renderHook(() => usePanelResize({ minWidth: 300, maxWidth: 800 }));

    act(() => {
      result.current.startResizing();
    });

    act(() => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 600 });
      document.dispatchEvent(moveEvent);
    });

    expect(result.current.width).toBe(600);
  });

  it('should clamp width to min', () => {
    const { result } = renderHook(() => usePanelResize({ minWidth: 300 }));

    act(() => {
      result.current.startResizing();
    });

    act(() => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 1000 });
      document.dispatchEvent(moveEvent);
    });

    expect(result.current.width).toBe(300);
  });

  it('should clamp width to max', () => {
    const { result } = renderHook(() => usePanelResize({ maxWidth: 800 }));

    act(() => {
      result.current.startResizing();
    });

    act(() => {
      const moveEvent = new MouseEvent('mousemove', { clientX: 100 });
      document.dispatchEvent(moveEvent);
    });

    expect(result.current.width).toBe(800);
  });

  it('should stop resizing on mouse up', () => {
    const { result } = renderHook(() => usePanelResize());

    act(() => {
      result.current.startResizing();
    });
    expect(result.current.isResizing).toBe(true);

    act(() => {
      const upEvent = new MouseEvent('mouseup');
      document.dispatchEvent(upEvent);
    });

    expect(result.current.isResizing).toBe(false);
  });
});
