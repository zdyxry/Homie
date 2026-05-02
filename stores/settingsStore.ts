import { create } from 'zustand';
import { StorageService } from '~/utils/storage';

interface SettingsState {
  perParagraphCopy: boolean;
  sendKey: 'enter' | 'ctrl-enter';
  autoFocusInput: boolean;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  saveSetting: <T>(key: string, value: T) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  perParagraphCopy: true,
  sendKey: 'ctrl-enter',
  autoFocusInput: true,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const perParagraphCopy = await StorageService.getSetting<boolean>('perParagraphCopy', true);
      const sendKey = await StorageService.getSetting<'enter' | 'ctrl-enter'>('sendKey', 'ctrl-enter');
      const autoFocusInput = await StorageService.getSetting<boolean>('autoFocusInput', true);
      set({ perParagraphCopy: perParagraphCopy ?? true, sendKey: sendKey ?? 'ctrl-enter', autoFocusInput: autoFocusInput ?? true });
    } finally {
      set({ isLoading: false });
    }
  },

  saveSetting: async <T>(key: string, value: T) => {
    set({ [key]: value } as Partial<SettingsState>);
    await StorageService.saveSetting(key, value);
  },
}));
