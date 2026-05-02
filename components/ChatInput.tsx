import React, { useRef, useEffect } from 'react';
import { useChatStore } from '~/stores/chatStore';
import { useModelStore } from '~/stores/modelStore';
import { useSettingsStore } from '~/stores/settingsStore';
import { usePageContent } from '~/hooks/usePageContent';
import { useDebugStore } from '~/stores/debugStore';
import { useHNStore } from '~/stores/hnStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { nanoid } from 'nanoid';

const ChatInput: React.FC = () => {
  const { selectedModel, models, selectModel } = useModelStore();
  const { inputValue, setInputValue, messages, isLoading, stopStreaming, streamResponse } = useChatStore();
  const { sendKey, autoFocusInput } = useSettingsStore();
  const { extract } = usePageContent();
  const { setContext } = useDebugStore();
  const { currentUrl } = useHNStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocusInput && models.length > 0) {
      textareaRef.current?.focus();
    }
  }, [autoFocusInput, models]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedModel || isLoading) return;

    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content: inputValue,
      timestamp: Date.now(),
    };

    useChatStore.getState().addMessage(userMessage);
    setInputValue('');

    const pageContent = await extract();
    if (!pageContent) {
      alert('Failed to extract page content');
      return;
    }

    const existingSystemMsg = messages.find((m) => m.role === 'system');
    const baseSystemPrompt = existingSystemMsg
      ? existingSystemMsg.content
      : 'You are a helpful assistant with access to the current web page content. Use the provided page context to answer user questions accurately.';

    const systemMsgId = existingSystemMsg ? existingSystemMsg.id : nanoid();
    const systemMsgTimestamp = existingSystemMsg ? existingSystemMsg.timestamp : Date.now();

    const systemMessageWithContext = {
      id: systemMsgId,
      role: 'system' as const,
      content: `${baseSystemPrompt}\n\nCurrent page content:\n---\nTitle: ${pageContent.title}\n\n${pageContent.textContent}\n---`,
      timestamp: systemMsgTimestamp,
    };

    const storageSystemMsg = {
      id: systemMsgId,
      role: 'system' as const,
      content: baseSystemPrompt,
      timestamp: systemMsgTimestamp,
    };

    const historyMessages = messages.filter((m) => m.role !== 'system');
    const messagesToSend = [systemMessageWithContext, ...historyMessages, userMessage];
    const visibleMessages = [storageSystemMsg, ...historyMessages, userMessage];

    if (!existingSystemMsg) {
      setContext(systemMessageWithContext.content);
      useChatStore.setState((state) => ({
        messages: [storageSystemMsg, ...state.messages],
      }));
    }

    await streamResponse(
      selectedModel,
      messagesToSend,
      visibleMessages,
      'Failed to send message',
      { pageTitle: pageContent.title, pageUrl: currentUrl || window.location.href }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendKey === 'enter') {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSendMessage();
      }
    } else {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  return (
    <div className="border-t border-border/80 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Model</span>
          <Badge variant="outline">{selectedModel ? selectedModel.name : 'Not set'}</Badge>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => useChatStore.getState().clearMessages()}>
            Clear thread
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        <Select
          value={selectedModel?.id || ''}
          onChange={(e) => {
            const modelId = e.target.value;
            if (modelId) selectModel(modelId);
          }}
        >
          <option value="">{models.length ? 'Choose a model' : 'Configure a model first'}</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.model})
            </option>
          ))}
        </Select>

        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Homie about this page..."
          onKeyDown={handleKeyDown}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {sendKey === 'enter'
              ? 'Enter to send · Shift + Enter for new line'
              : 'Ctrl/Cmd + Enter to send · Enter for new line'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isLoading ? 'destructive' : 'primary'}
              onClick={() => {
                if (isLoading) {
                  stopStreaming();
                } else {
                  handleSendMessage();
                }
              }}
              disabled={!isLoading && (!inputValue.trim() || !selectedModel)}
            >
              {isLoading ? 'Stop' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
