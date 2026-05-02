import { getItem, setItem } from './base';
import { StorageKeys } from './constants';

export async function getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  const settings = await getItem<Record<string, unknown>>(StorageKeys.SETTINGS);
  if (!settings) return defaultValue;
  return (settings[key] as T) ?? defaultValue;
}

export async function getSettings(): Promise<Record<string, unknown>> {
  return (await getItem<Record<string, unknown>>(StorageKeys.SETTINGS)) || {};
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const settings = await getSettings();
  settings[key] = value;
  await setItem(StorageKeys.SETTINGS, settings);
}
