import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModelStore } from './modelStore';
import { StorageService } from '~/utils/storage';

vi.mock('~/utils/storage', () => ({
  StorageService: {
    getModels: vi.fn(),
    getCommonModelConfig: vi.fn(),
    getSelectedModel: vi.fn(),
    setSelectedModel: vi.fn(),
  },
}));

describe('useModelStore', () => {
  beforeEach(() => {
    useModelStore.setState({ models: [], selectedModel: null, isLoading: false });
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const state = useModelStore.getState();
    expect(state.models).toEqual([]);
    expect(state.selectedModel).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('should load models', async () => {
    const customModel = { id: 'custom-1', name: 'Custom', provider: 'openai', apiKey: 'key', model: 'gpt-4' };
    vi.mocked(StorageService.getModels).mockResolvedValue([customModel]);
    vi.mocked(StorageService.getCommonModelConfig).mockResolvedValue(null);
    vi.mocked(StorageService.getSelectedModel).mockResolvedValue('custom-1');

    await useModelStore.getState().loadModels();

    const state = useModelStore.getState();
    expect(state.models).toHaveLength(1);
    expect(state.selectedModel?.id).toBe('custom-1');
    expect(state.isLoading).toBe(false);
  });

  it('should select model', async () => {
    useModelStore.setState({
      models: [{ id: 'm1', name: 'Model 1', provider: 'openai', apiKey: 'k', model: 'gpt-4' }],
    });

    await useModelStore.getState().selectModel('m1');

    expect(useModelStore.getState().selectedModel?.id).toBe('m1');
    expect(StorageService.setSelectedModel).toHaveBeenCalledWith('m1');
  });
});
