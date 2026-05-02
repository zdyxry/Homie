import { create } from 'zustand';
import { StorageService, type Assistant } from '~/utils/storage';

interface AssistantState {
  assistants: Assistant[];
  enabledAssistants: Assistant[];
  isLoading: boolean;
  loadAssistants: () => Promise<void>;
  toggleAssistant: (id: string, enabled: boolean) => Promise<void>;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  assistants: [],
  enabledAssistants: [],
  isLoading: false,

  loadAssistants: async () => {
    set({ isLoading: true });
    try {
      const assistants = await StorageService.getAssistants();
      set({
        assistants,
        enabledAssistants: assistants.filter((a) => a.enabled),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleAssistant: async (id: string, enabled: boolean) => {
    await StorageService.toggleAssistant(id, enabled);
    await get().loadAssistants();
  },
}));
