import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  disableThreshold?: number;
  enableThreshold?: number;
}

interface UseAutoScrollReturn {
  autoScroll: boolean;
  contentRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const { disableThreshold = 120, enableThreshold = 60 } = options;
  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [autoScroll, scrollToBottom]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (autoScrollRef.current && distanceFromBottom > disableThreshold) {
        setAutoScroll(false);
      } else if (!autoScrollRef.current && distanceFromBottom < enableThreshold) {
        setAutoScroll(true);
      }
    };

    contentElement.addEventListener('scroll', handleScroll);
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, [disableThreshold, enableThreshold]);

  return { autoScroll, contentRef, messagesEndRef, scrollToBottom };
}
