import React, { useEffect } from 'react';
import { usePanelResize } from '~/hooks/usePanelResize';
import { useAutoScroll } from '~/hooks/useAutoScroll';
import { useModelStore } from '~/stores/modelStore';
import { useAssistantStore } from '~/stores/assistantStore';
import { useChatStore } from '~/stores/chatStore';
import { useHNStore } from '~/stores/hnStore';
import { useSettingsStore } from '~/stores/settingsStore';
import { usePageContent } from '~/hooks/usePageContent';
import PanelHeader from './PanelHeader';
import HackerNewsBanner from './HackerNewsBanner';
import AssistantButtons from './AssistantButtons';
import EmptyState from './EmptyState';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface SummaryPanelProps {
  onWidthChange?: (width: number) => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = (props) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const { width, startResizing } = usePanelResize();
  const { contentRef, messagesEndRef } = useAutoScroll();
  const { loadModels } = useModelStore();
  const { loadAssistants } = useAssistantStore();
  const { loadHistory } = useChatStore();
  const { currentUrl, search } = useHNStore();
  const { loadSettings } = useSettingsStore();
  usePageContent();

  useEffect(() => {
    loadSettings();
    loadModels();
    loadAssistants();
  }, [loadSettings, loadModels, loadAssistants]);

  useEffect(() => {
    const init = async () => {
      await search();
    };
    init();
  }, [search]);

  useEffect(() => {
    if (currentUrl) {
      loadHistory(currentUrl);
    }
  }, [currentUrl, loadHistory]);

  useEffect(() => {
    if (isVisible) {
      props.onWidthChange?.(width);
    } else {
      props.onWidthChange?.(0);
    }
  }, [isVisible, width, props]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-[2147483647] flex"
      style={{ width: `${width}px` }}
    >
      <div
        className="absolute -left-1 top-0 h-full w-3 cursor-ew-resize bg-transparent transition-colors hover:bg-primary/40"
        onMouseDown={startResizing}
      />

      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl"
        style={{ borderLeft: '1px solid #6b7280' }}
      >
        <PanelHeader onClose={() => setIsVisible(false)} />
        <HackerNewsBanner />

        <div className="border-b border-border/70 bg-muted/40 px-6 py-4">
          <AssistantButtons />
        </div>

        <div ref={contentRef} className="scroll-area flex-1 overflow-y-auto px-6 py-4">
          <EmptyState />
          <ChatMessages messagesEndRef={messagesEndRef} />
        </div>

        <ChatInput />
      </div>
    </div>
  );
};

export default SummaryPanel;
