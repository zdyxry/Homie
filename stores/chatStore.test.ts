import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';
import { StorageService } from '~/utils/storage';

vi.mock('~/utils/ai-service', () => ({
  AIService: vi.fn(),
}));

vi.mock('~/utils/storage', () => ({
  StorageService: {
    getHistoryByUrl: vi.fn(),
    saveHistory: vi.fn(),
  },
}));

import { AIService } from '~/utils/ai-service';

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      inputValue: '',
      isLoading: false,
      abortController: null,
      shouldStop: false,
    });
    vi.clearAllMocks();
  });

  it('should add message', () => {
    const msg = { id: '1', role: 'user' as const, content: 'Hello', timestamp: 1 };
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('should update message', () => {
    const msg = { id: '1', role: 'assistant' as const, content: '', timestamp: 1 };
    useChatStore.getState().addMessage(msg);
    useChatStore.getState().updateMessage('1', (m) => ({ ...m, content: 'Hi' }));
    expect(useChatStore.getState().messages[0].content).toBe('Hi');
  });

  it('should clear messages', () => {
    useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'Hi', timestamp: 1 });
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it('should load history', async () => {
    const history = {
      id: 'h1',
      pageTitle: 'Test',
      pageUrl: 'https://example.com',
      modelName: 'M',
      modelId: 'm1',
      messages: [{ id: '1', role: 'user', content: 'Hi', timestamp: 1 }],
      createdAt: 1,
    };
    vi.mocked(StorageService.getHistoryByUrl).mockResolvedValue(history);

    await useChatStore.getState().loadHistory('https://example.com');

    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('should stream response', async () => {
    const mockModel = { id: 'm1', name: 'Test', provider: 'openai', apiKey: 'k', model: 'gpt-4' };
    const mockStream = async function* () {
      yield 'Hello';
      yield ' World';
    };

    vi.mocked(AIService).mockImplementation(function () {
      return { chatStream: mockStream };
    } as unknown as typeof AIService);

    vi.spyOn(StorageService, 'saveHistory').mockResolvedValue(undefined);

    const sendMessages = [{ id: '1', role: 'user' as const, content: 'Hi', timestamp: 1 }];

    await useChatStore.getState().streamResponse(
      mockModel,
      sendMessages,
      sendMessages,
      'Error',
      { pageTitle: 'Test', pageUrl: 'https://example.com' }
    );

    const state = useChatStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].content).toBe('Hello World');
  });
});
