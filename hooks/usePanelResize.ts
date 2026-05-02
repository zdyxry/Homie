import { useState, useEffect, useCallback } from 'react';

interface UsePanelResizeOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

interface UsePanelResizeReturn {
  width: number;
  isResizing: boolean;
  startResizing: () => void;
}

export function usePanelResize(options: UsePanelResizeOptions = {}): UsePanelResizeReturn {
  const {
    initialWidth = 600,
    minWidth = 300,
    maxWidth = 800,
  } = options;

  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setWidth(() => {
        const clamped = Math.max(minWidth, Math.min(maxWidth, newWidth));
        return clamped;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return { width, isResizing, startResizing };
}
