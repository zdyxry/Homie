// Re-export types
export * from './types';
export * from './constants';

// Re-export storage modules for fine-grained imports
export * as modelStorage from './modelStorage';
export * as assistantStorage from './assistantStorage';
export * as historyStorage from './historyStorage';
export * as settingsStorage from './settingsStorage';

// Legacy unified StorageService for backward compatibility
import * as model from './modelStorage';
import * as assistant from './assistantStorage';
import * as history from './historyStorage';
import * as settings from './settingsStorage';

export const StorageService = {
  // Models
  getModels: model.getModels,
  saveModel: model.saveModel,
  deleteModel: model.deleteModel,
  getSelectedModel: model.getSelectedModel,
  setSelectedModel: model.setSelectedModel,
  getCommonModelConfig: model.getCommonModelConfig,
  saveCommonModelConfig: model.saveCommonModelConfig,
  deleteCommonModelConfig: model.deleteCommonModelConfig,

  // Assistants
  getAssistants: assistant.getAssistants,
  saveAssistant: assistant.saveAssistant,
  deleteAssistant: assistant.deleteAssistant,
  toggleAssistant: assistant.toggleAssistant,
  resetAssistant: assistant.resetAssistant,

  // History
  getHistory: history.getHistory,
  saveHistory: history.saveHistory,
  deleteHistory: history.deleteHistory,
  clearAllHistory: history.clearAllHistory,
  getHistoryByUrl: history.getHistoryByUrl,

  // Settings
  getSetting: settings.getSetting,
  getSettings: settings.getSettings,
  saveSetting: settings.saveSetting,
};
