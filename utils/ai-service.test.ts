import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService, AIError } from './ai-service';

const mockModel = {
  id: 'test',
  name: 'Test',
  provider: 'openai' as const,
  apiKey: 'sk-test',
  model: 'gpt-4',
};

describe('AIService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return chat completion', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello' } }],
      }),
    });

    const service = new AIService(mockModel);
    const result = await service.chat([
      { id: '1', role: 'user', content: 'Hi', timestamp: 1 },
    ]);

    expect(result).toBe('Hello');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      })
    );
  });

  it('should throw AIError on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Unauthorized' } }),
    });

    const service = new AIService(mockModel);
    await expect(service.chat([{ id: '1', role: 'user', content: 'Hi', timestamp: 1 }]))
      .rejects.toBeInstanceOf(AIError);
  });

  it('should stream tokens', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    let chunkIndex = 0;
    const mockReader = {
      read: async () => {
        if (chunkIndex >= chunks.length) return { done: true, value: undefined };
        return { done: false, value: encoder.encode(chunks[chunkIndex++]) };
      },
      releaseLock: () => {},
      closed: Promise.resolve(undefined),
      cancel: () => Promise.resolve(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const service = new AIService(mockModel);
    const tokens: string[] = [];

    for await (const token of service.chatStream([{ id: '1', role: 'user', content: 'Hi', timestamp: 1 }])) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Hello']);
  });

  it('should use custom endpoint', async () => {
    const customModel = { ...mockModel, provider: 'custom' as const, apiEndpoint: 'https://custom.api/v1' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });

    const service = new AIService(customModel);
    await service.chat([{ id: '1', role: 'user', content: 'Hi', timestamp: 1 }]);

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.api/v1/chat/completions',
      expect.anything()
    );
  });
});
