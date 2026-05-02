import { create } from 'zustand';
import { StorageService, type AIModel } from '~/utils/storage';

interface ModelState {
  models: AIModel[];
  selectedModel: AIModel | null;
  isLoading: boolean;
  loadModels: () => Promise<void>;
  selectModel: (modelId: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  selectedModel: null,
  isLoading: false,

  loadModels: async () => {
    set({ isLoading: true });
    try {
      const customModels = await StorageService.getModels();
      const commonProviders = ['gemini', 'deepseek'];
      const commonModels: AIModel[] = [];

      for (const providerId of commonProviders) {
        const config = await StorageService.getCommonModelConfig(providerId);
        if (config && config.apiKey && config.model) {
          commonModels.push({
            id: `common-${providerId}`,
            name: config.name || providerId,
            provider: config.provider || 'custom',
            apiKey: config.apiKey,
            model: config.model,
            apiEndpoint: config.apiEndpoint,
          } as AIModel);
        }
      }

      const allModels = [...commonModels, ...customModels];
      const selectedModelId = await StorageService.getSelectedModel();
      const selected = allModels.find((m) => m.id === selectedModelId) || allModels[0] || null;

      set({ models: allModels, selectedModel: selected });
    } finally {
      set({ isLoading: false });
    }
  },

  selectModel: async (modelId: string) => {
    const model = get().models.find((m) => m.id === modelId);
    if (model) {
      set({ selectedModel: model });
      await StorageService.setSelectedModel(modelId);
    }
  },
}));
