import { create } from 'zustand';

interface DebugState {
  debugContext: string;
  isVisible: boolean;
  setContext: (context: string) => void;
  show: () => void;
  hide: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  debugContext: '',
  isVisible: false,
  setContext: (context) => set({ debugContext: context }),
  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
}));
