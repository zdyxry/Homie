import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as settingsStorage from './settingsStorage';

vi.mock('./base', () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

import { getItem, setItem } from './base';

describe('settingsStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default when setting not found', async () => {
    vi.mocked(getItem).mockResolvedValue(null);
    const value = await settingsStorage.getSetting('theme', 'dark');
    expect(value).toBe('dark');
  });

  it('should retrieve existing setting', async () => {
    vi.mocked(getItem).mockResolvedValue({ theme: 'light' });
    const value = await settingsStorage.getSetting('theme', 'dark');
    expect(value).toBe('light');
  });

  it('should save setting', async () => {
    vi.mocked(getItem).mockResolvedValue({ theme: 'light' });
    await settingsStorage.saveSetting('fontSize', 14);
    expect(setItem).toHaveBeenCalledWith('settings', { theme: 'light', fontSize: 14 });
  });
});
