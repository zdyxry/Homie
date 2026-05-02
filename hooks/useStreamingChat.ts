import { useState, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { AIService } from '~/utils/ai-service';
import { StorageService, type ChatMessage, type AIModel, type ConversationHistory } from '~/utils/storage';

interface HistoryContext {
  pageTitle: string;
  pageUrl: string;
  assistantName?: string;
}

interface UseStreamingChatReturn {
  isLoading: boolean;
  stopStreaming: () => void;
  streamResponse: (
    sendMessages: ChatMessage[],
    visibleMessages: ChatMessage[],
    onErrorMessage: string,
    historyContext?: HistoryContext
  ) => Promise<void>;
}

export function useStreamingChat(
  selectedModel: AIModel | null,
  onMessagesUpdate?: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void
): UseStreamingChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const shouldStopRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    shouldStopRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

  const streamResponse = useCallback(
    async (
      sendMessages: ChatMessage[],
      visibleMessages: ChatMessage[],
      onErrorMessage: string,
      historyContext?: HistoryContext
    ) => {
      if (!selectedModel) {
        alert('Please configure an AI model first');
        return;
      }

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      shouldStopRef.current = false;
      setIsLoading(true);

      const aiService = new AIService(selectedModel);
      let assistantContent = '';

      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      onMessagesUpdate?.((prev) => [...prev, assistantMessage]);

      try {
        for await (const token of aiService.chatStream(sendMessages, abortController.signal)) {
          if (abortController.signal.aborted || shouldStopRef.current) {
            break;
          }
          assistantContent += token;
          onMessagesUpdate?.((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id ? { ...msg, content: assistantContent } : msg
            )
          );
        }

        // Save conversation history after successful completion
        if (assistantContent && historyContext) {
          const finalMessages = [...visibleMessages, { ...assistantMessage, content: assistantContent }];
          const historyRecord: ConversationHistory = {
            id: nanoid(),
            pageTitle: historyContext.pageTitle,
            pageUrl: historyContext.pageUrl,
            modelName: selectedModel.name,
            modelId: selectedModel.id,
            assistantName: historyContext.assistantName,
            messages: finalMessages,
            createdAt: Date.now(),
          };
          await StorageService.saveHistory(historyRecord);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('Streaming error:', error);
        alert(onErrorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedModel, onMessagesUpdate]
  );

  return { isLoading, stopStreaming, streamResponse };
}
