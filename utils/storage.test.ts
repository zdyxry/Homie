import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, type AIModel, DEFAULT_ASSISTANTS } from './storage';

// Mock wxt/storage
const mockStore = new Map<string, unknown>();

vi.mock('wxt/storage', () => ({
  storage: {
    getItem: async <T>(key: string): Promise<T | null> => {
      const value = mockStore.get(key);
      return value !== undefined ? (value as T) : null;
    },
    setItem: async (key: string, value: unknown) => {
      mockStore.set(key, value);
    },
    removeItem: async (key: string) => {
      mockStore.delete(key);
    },
  },
}));

describe('StorageService', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  describe('Models', () => {
    it('should return empty array when no models exist', async () => {
      const models = await StorageService.getModels();
      expect(models).toEqual([]);
    });

    it('should save and retrieve models', async () => {
      const model: AIModel = {
        id: 'test-model',
        name: 'Test Model',
        provider: 'openai',
        apiKey: 'sk-test',
        model: 'gpt-4',
      };

      await StorageService.saveModel(model);
      const models = await StorageService.getModels();
      expect(models).toHaveLength(1);
      expect(models[0]).toEqual(model);
    });

    it('should update existing model', async () => {
      const model: AIModel = {
        id: 'test-model',
        name: 'Test Model',
        provider: 'openai',
        apiKey: 'sk-test',
        model: 'gpt-4',
      };

      await StorageService.saveModel(model);
      await StorageService.saveModel({ ...model, name: 'Updated Model' });
      const models = await StorageService.getModels();
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('Updated Model');
    });

    it('should delete model', async () => {
      const model: AIModel = {
        id: 'test-model',
        name: 'Test Model',
        provider: 'openai',
        apiKey: 'sk-test',
        model: 'gpt-4',
      };

      await StorageService.saveModel(model);
      await StorageService.deleteModel('test-model');
      const models = await StorageService.getModels();
      expect(models).toHaveLength(0);
    });
  });

  describe('Selected Model', () => {
    it('should save and retrieve selected model', async () => {
      await StorageService.setSelectedModel('model-1');
      const selected = await StorageService.getSelectedModel();
      expect(selected).toBe('model-1');
    });

    it('should return null when no model selected', async () => {
      const selected = await StorageService.getSelectedModel();
      expect(selected).toBeNull();
    });
  });

  describe('Assistants', () => {
    it('should return default assistants when none stored', async () => {
      const assistants = await StorageService.getAssistants();
      expect(assistants).toHaveLength(DEFAULT_ASSISTANTS.length);
      expect(assistants.map(a => a.id)).toEqual(DEFAULT_ASSISTANTS.map(a => a.id));
    });

    it('should preserve enabled state on built-in assistants during merge', async () => {
      // First, initialize defaults
      let assistants = await StorageService.getAssistants();
      const tldr = assistants.find(a => a.id === 'tldr')!;
      expect(tldr.enabled).toBe(true);

      // Disable tldr
      await StorageService.toggleAssistant('tldr', false);
      assistants = await StorageService.getAssistants();
      const updatedTldr = assistants.find(a => a.id === 'tldr')!;
      expect(updatedTldr.enabled).toBe(false);
    });

    it('should mark built-in assistant as modified when content changes', async () => {
      await StorageService.getAssistants(); // initialize
      const assistants = await StorageService.getAssistants();
      const tldr = assistants.find(a => a.id === 'tldr')!;

      await StorageService.saveAssistant({ ...tldr, name: 'Modified Name' });
      const updated = await StorageService.getAssistants();
      const modifiedTldr = updated.find(a => a.id === 'tldr')!;
      expect(modifiedTldr.isModifiedByUser).toBe(true);
    });
  });

  describe('History', () => {
    it('should save and retrieve history', async () => {
      const record = {
        id: 'hist-1',
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com',
        modelName: 'Test Model',
        modelId: 'model-1',
        messages: [],
        createdAt: Date.now(),
      };

      await StorageService.saveHistory(record);
      const history = await StorageService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].pageTitle).toBe('Test Page');
    });

    it('should deduplicate by URL keeping latest', async () => {
      const url = 'https://example.com';
      const record1 = {
        id: 'hist-1',
        pageTitle: 'Old Title',
        pageUrl: url,
        modelName: 'Model',
        modelId: 'm1',
        messages: [],
        createdAt: 1000,
      };
      const record2 = {
        id: 'hist-2',
        pageTitle: 'New Title',
        pageUrl: url,
        modelName: 'Model',
        modelId: 'm1',
        messages: [],
        createdAt: 2000,
      };

      await StorageService.saveHistory(record1);
      await StorageService.saveHistory(record2);
      const history = await StorageService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].pageTitle).toBe('New Title');
    });

    it('should limit history to 100 records', async () => {
      for (let i = 0; i < 105; i++) {
        await StorageService.saveHistory({
          id: `hist-${i}`,
          pageTitle: `Page ${i}`,
          pageUrl: `https://example.com/${i}`,
          modelName: 'Model',
          modelId: 'm1',
          messages: [],
          createdAt: Date.now(),
        });
      }

      const history = await StorageService.getHistory();
      expect(history).toHaveLength(100);
    });
  });

  describe('Settings', () => {
    it('should save and retrieve settings', async () => {
      await StorageService.saveSetting('theme', 'dark');
      const theme = await StorageService.getSetting<string>('theme');
      expect(theme).toBe('dark');
    });

    it('should return default value when setting not found', async () => {
      const value = await StorageService.getSetting('nonexistent', 'default');
      expect(value).toBe('default');
    });
  });
});
