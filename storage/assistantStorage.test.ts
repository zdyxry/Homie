import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assistantStorage from './assistantStorage';
import { DEFAULT_ASSISTANTS } from './constants';

vi.mock('./base', () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

import { getItem, setItem } from './base';

describe('assistantStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return defaults when empty', async () => {
    vi.mocked(getItem).mockResolvedValue(null);
    const assistants = await assistantStorage.getAssistants();
    expect(assistants).toHaveLength(DEFAULT_ASSISTANTS.length);
  });

  it('should preserve enabled state on built-in merge', async () => {
    const stored = DEFAULT_ASSISTANTS.map((a) => ({ ...a, enabled: false }));
    vi.mocked(getItem).mockResolvedValue(stored);
    const assistants = await assistantStorage.getAssistants();
    expect(assistants[0].enabled).toBe(false);
  });

  it('should mark modified built-in as user-modified', async () => {
    vi.mocked(getItem).mockResolvedValue([...DEFAULT_ASSISTANTS]);
    const modified = { ...DEFAULT_ASSISTANTS[0], name: 'Changed' };
    await assistantStorage.saveAssistant(modified);
    const saved = vi.mocked(setItem).mock.calls[0][1] as typeof DEFAULT_ASSISTANTS;
    expect(saved[0].isModifiedByUser).toBe(true);
  });

  it('should toggle assistant enabled state', async () => {
    vi.mocked(getItem).mockResolvedValue([...DEFAULT_ASSISTANTS]);
    await assistantStorage.toggleAssistant('tldr', false);
    const saved = vi.mocked(setItem).mock.calls[0][1] as typeof DEFAULT_ASSISTANTS;
    expect(saved.find((a) => a.id === 'tldr')?.enabled).toBe(false);
  });

  it('should reset built-in to default', async () => {
    const modified = { ...DEFAULT_ASSISTANTS[0], name: 'Changed', isModifiedByUser: true };
    vi.mocked(getItem).mockResolvedValue([modified]);
    await assistantStorage.resetAssistant('tldr');
    const saved = vi.mocked(setItem).mock.calls[0][1] as typeof DEFAULT_ASSISTANTS;
    const tldr = saved.find((a) => a.id === 'tldr');
    expect(tldr?.name).toBe(DEFAULT_ASSISTANTS[0].name);
    expect(tldr?.isModifiedByUser).toBe(false);
  });
});
