import { vi } from 'vitest';

export function createMockStorage() {
  const store = new Map<string, unknown>();

  return {
    getItem: vi.fn(async <T>(key: string): Promise<T | null> => {
      const value = store.get(key);
      return value !== undefined ? (value as T) : null;
    }),
    setItem: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    store,
    clear() {
      store.clear();
    },
  };
}

export function createMockBrowser() {
  return {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    },
    tabs: {
      sendMessage: vi.fn(),
      create: vi.fn(),
    },
    action: {
      onClicked: {
        addListener: vi.fn(),
      },
    },
    scripting: {
      executeScript: vi.fn(),
    },
  };
}
