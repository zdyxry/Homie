import { getItem, setItem } from './base';
import { StorageKeys } from './constants';
import type { AIModel } from './types';

export async function getModels(): Promise<AIModel[]> {
  return (await getItem<AIModel[]>(StorageKeys.MODELS)) || [];
}

export async function saveModel(model: AIModel): Promise<void> {
  const models = await getModels();
  const index = models.findIndex((m) => m.id === model.id);
  if (index >= 0) {
    models[index] = model;
  } else {
    models.push(model);
  }
  await setItem(StorageKeys.MODELS, models);
}

export async function deleteModel(modelId: string): Promise<void> {
  const models = await getModels();
  const filtered = models.filter((m) => m.id !== modelId);
  await setItem(StorageKeys.MODELS, filtered);
}

export async function getSelectedModel(): Promise<string | null> {
  return await getItem<string>(StorageKeys.SELECTED_MODEL);
}

export async function setSelectedModel(modelId: string): Promise<void> {
  await setItem(StorageKeys.SELECTED_MODEL, modelId);
}

export async function getCommonModelConfig(providerId: string): Promise<Partial<AIModel> | null> {
  const configs = await getItem<Record<string, Partial<AIModel>>>(StorageKeys.COMMON_MODEL_CONFIGS);
  return configs?.[providerId] || null;
}

export async function saveCommonModelConfig(providerId: string, config: Partial<AIModel>): Promise<void> {
  const configs = (await getItem<Record<string, Partial<AIModel>>>(StorageKeys.COMMON_MODEL_CONFIGS)) || {};
  configs[providerId] = config;
  await setItem(StorageKeys.COMMON_MODEL_CONFIGS, configs);
}

export async function deleteCommonModelConfig(providerId: string): Promise<void> {
  const configs = (await getItem<Record<string, Partial<AIModel>>>(StorageKeys.COMMON_MODEL_CONFIGS)) || {};
  delete configs[providerId];
  await setItem(StorageKeys.COMMON_MODEL_CONFIGS, configs);
}
