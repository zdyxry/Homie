import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as modelStorage from './modelStorage';

vi.mock('./base', () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

import { getItem, setItem } from './base';

describe('modelStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no models', async () => {
    vi.mocked(getItem).mockResolvedValue(null);
    const models = await modelStorage.getModels();
    expect(models).toEqual([]);
  });

  it('should save new model', async () => {
    vi.mocked(getItem).mockResolvedValue([]);
    const model = { id: 'm1', name: 'Test', provider: 'openai' as const, apiKey: 'k', model: 'gpt-4' };
    await modelStorage.saveModel(model);
    expect(setItem).toHaveBeenCalledWith('models', [model]);
  });

  it('should update existing model', async () => {
    const existing = { id: 'm1', name: 'Old', provider: 'openai' as const, apiKey: 'k', model: 'gpt-4' };
    vi.mocked(getItem).mockResolvedValue([existing]);
    await modelStorage.saveModel({ ...existing, name: 'New' });
    expect(setItem).toHaveBeenCalledWith('models', [{ ...existing, name: 'New' }]);
  });

  it('should delete model', async () => {
    vi.mocked(getItem).mockResolvedValue([
      { id: 'm1', name: 'Test', provider: 'openai' as const, apiKey: 'k', model: 'gpt-4' },
    ]);
    await modelStorage.deleteModel('m1');
    expect(setItem).toHaveBeenCalledWith('models', []);
  });

  it('should get and set selected model', async () => {
    vi.mocked(getItem).mockResolvedValue('m1');
    const selected = await modelStorage.getSelectedModel();
    expect(selected).toBe('m1');

    await modelStorage.setSelectedModel('m2');
    expect(setItem).toHaveBeenCalledWith('selectedModel', 'm2');
  });

  it('should manage common model configs', async () => {
    vi.mocked(getItem).mockResolvedValue({});
    const config = { apiKey: 'key', model: 'gpt-4' };
    await modelStorage.saveCommonModelConfig('openai', config);
    expect(setItem).toHaveBeenCalledWith('commonModelConfigs', { openai: config });

    vi.mocked(getItem).mockResolvedValue({ openai: config });
    const retrieved = await modelStorage.getCommonModelConfig('openai');
    expect(retrieved).toEqual(config);
  });
});
