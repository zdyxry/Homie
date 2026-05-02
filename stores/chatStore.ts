import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { StorageService, type ChatMessage, type AIModel, type ConversationHistory } from '~/utils/storage';
import { AIService } from '~/utils/ai-service';

interface ChatState {
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  abortController: AbortController | null;
  shouldStop: boolean;
  setInputValue: (value: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updater: (msg: ChatMessage) => ChatMessage) => void;
  clearMessages: () => void;
  loadHistory: (url: string) => Promise<void>;
  stopStreaming: () => void;
  streamResponse: (
    selectedModel: AIModel,
    sendMessages: ChatMessage[],
    visibleMessages: ChatMessage[],
    onErrorMessage: string,
    historyContext?: { pageTitle: string; pageUrl: string; assistantName?: string }
  ) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  inputValue: '',
  isLoading: false,
  abortController: null,
  shouldStop: false,

  setInputValue: (value) => set({ inputValue: value }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updater) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === id ? updater(msg) : msg)),
    })),

  clearMessages: () => set({ messages: [] }),

  loadHistory: async (url: string) => {
    try {
      const history = await StorageService.getHistoryByUrl(url);
      if (history && history.messages.length > 0) {
        set({ messages: history.messages });
      }
    } catch (error) {
      console.error('Failed to load previous conversation:', error);
    }
  },

  stopStreaming: () => {
    set({ shouldStop: true });
    get().abortController?.abort();
  },

  streamResponse: async (selectedModel, sendMessages, visibleMessages, onErrorMessage, historyContext) => {
    const abortController = new AbortController();
    set({ abortController, shouldStop: false, isLoading: true });

    const aiService = new AIService(selectedModel);
    let assistantContent = '';

    const assistantMessage: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    set((state) => ({ messages: [...state.messages, assistantMessage] }));

    try {
      for await (const token of aiService.chatStream(sendMessages, abortController.signal)) {
        if (abortController.signal.aborted || get().shouldStop) {
          break;
        }
        assistantContent += token;
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content: assistantContent } : msg
          ),
        }));
      }

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
      set({ isLoading: false, abortController: null });
    }
  },
}));
