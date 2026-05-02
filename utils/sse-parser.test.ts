import { describe, it, expect } from 'vitest';
import { parseSSEStream } from './sse-parser';

function createMockReader(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  let index = 0;
  return {
    read: async () => {
      if (index >= chunks.length) {
        return { done: true, value: undefined };
      }
      const chunk = chunks[index++];
      const encoder = new TextEncoder();
      return { done: false, value: encoder.encode(chunk) };
    },
    releaseLock: () => {},
    closed: Promise.resolve(undefined),
    cancel: () => Promise.resolve(),
  } as ReadableStreamDefaultReader<Uint8Array>;
}

describe('parseSSEStream', () => {
  it('should yield content from SSE events', async () => {
    const reader = createMockReader([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);

    const tokens: string[] = [];
    for await (const token of parseSSEStream(reader)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Hello', ' World']);
  });

  it('should handle fragmented data', async () => {
    const reader = createMockReader([
      'data: {"choices":[{"delta":{"content":"Hel',
      'lo"}}]}\n\n',
    ]);

    const tokens: string[] = [];
    for await (const token of parseSSEStream(reader)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Hello']);
  });

  it('should ignore invalid JSON', async () => {
    const reader = createMockReader([
      'data: invalid json\n\n',
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
    ]);

    const tokens: string[] = [];
    for await (const token of parseSSEStream(reader)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['ok']);
  });

  it('should stop on abort signal', async () => {
    const reader = createMockReader([
      'data: {"choices":[{"delta":{"content":"first"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"second"}}]}\n\n',
    ]);

    const controller = new AbortController();
    controller.abort();

    const tokens: string[] = [];
    for await (const token of parseSSEStream(reader, controller.signal)) {
      tokens.push(token);
    }

    expect(tokens).toEqual([]);
  });
});
