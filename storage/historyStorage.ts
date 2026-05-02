import { getItem, setItem } from './base';
import { StorageKeys } from './constants';
import type { ConversationHistory } from './types';

const MAX_HISTORY = 100;

export async function getHistory(): Promise<ConversationHistory[]> {
  return (await getItem<ConversationHistory[]>(StorageKeys.HISTORY)) || [];
}

export async function saveHistory(record: ConversationHistory): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((h) => h.pageUrl !== record.pageUrl);
  filtered.unshift(record);
  await setItem(StorageKeys.HISTORY, filtered.slice(0, MAX_HISTORY));
}

export async function deleteHistory(historyId: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((h) => h.id !== historyId);
  await setItem(StorageKeys.HISTORY, filtered);
}

export async function clearAllHistory(): Promise<void> {
  await setItem(StorageKeys.HISTORY, []);
}

export async function getHistoryByUrl(url: string): Promise<ConversationHistory | null> {
  const history = await getHistory();
  return history.find((h) => h.pageUrl === url) || null;
}
