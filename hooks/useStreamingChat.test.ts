import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStreamingChat } from './useStreamingChat';
import { StorageService } from '~/utils/storage';

// Mock AIService class
vi.mock('~/utils/ai-service', () => {
  return {
    AIService: vi.fn(),
  };
});

import { AIService } from '~/utils/ai-service';

describe('useStreamingChat', () => {
  const mockModel = {
    id: 'test-model',
    name: 'Test Model',
    provider: 'openai' as const,
    apiKey: 'sk-test',
    model: 'gpt-4',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with isLoading false', () => {
    const { result } = renderHook(() => useStreamingChat(mockModel));
    expect(result.current.isLoading).toBe(false);
  });

  it('should alert when no model is selected', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    const { result } = renderHook(() => useStreamingChat(null));

    await act(async () => {
      await result.current.streamResponse([], [], 'Error');
    });

    expect(alertMock).toHaveBeenCalledWith('Please configure an AI model first');
    vi.unstubAllGlobals();
  });

  it('should stream tokens and update messages', async () => {
    const messagesUpdate = vi.fn();
    const { result } = renderHook(() => useStreamingChat(mockModel, messagesUpdate));

    const mockStream = async function* () {
      yield 'Hello';
      yield ' World';
    };

    vi.mocked(AIService).mockImplementation(function () {
      return {
        chatStream: mockStream,
      };
    } as unknown as typeof AIService);

    vi.spyOn(StorageService, 'saveHistory').mockResolvedValue(undefined);

    const sendMessages = [{ id: '1', role: 'user' as const, content: 'Hi', timestamp: 1 }];
    const visibleMessages = [...sendMessages];

    await act(async () => {
      await result.current.streamResponse(
        sendMessages,
        visibleMessages,
        'Error',
        { pageTitle: 'Test', pageUrl: 'https://example.com' }
      );
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(messagesUpdate).toHaveBeenCalled();
    expect(StorageService.saveHistory).toHaveBeenCalled();
  });

  it('should stop streaming on abort', async () => {
    const messagesUpdate = vi.fn();
    const { result } = renderHook(() => useStreamingChat(mockModel, messagesUpdate));

    const mockStream = async function* () {
      yield 'token1';
      yield 'token2';
      yield 'token3';
    };

    vi.mocked(AIService).mockImplementation(function () {
      return {
        chatStream: mockStream,
      };
    } as unknown as typeof AIService);

    const sendMessages = [{ id: '1', role: 'user' as const, content: 'Hi', timestamp: 1 }];

    await act(async () => {
      const promise = result.current.streamResponse(sendMessages, sendMessages, 'Error');
      result.current.stopStreaming();
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
