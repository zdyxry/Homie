import { storage } from 'wxt/storage';

export async function getItem<T>(key: string): Promise<T | null> {
  return await storage.getItem<T>(`local:${key}`);
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await storage.setItem(`local:${key}`, value);
}

export async function removeItem(key: string): Promise<void> {
  await storage.removeItem(`local:${key}`);
}
