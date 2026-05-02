import { getItem, setItem } from './base';
import { StorageKeys, DEFAULT_ASSISTANTS } from './constants';
import type { Assistant } from './types';

function sortById(a: Assistant, b: Assistant): number {
  return a.id.localeCompare(b.id);
}

function areAssistantsEqual(a: Assistant[], b: Assistant[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort(sortById);
  const sortedB = [...b].sort(sortById);
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i].id !== sortedB[i].id) return false;
    if (sortedA[i].enabled !== sortedB[i].enabled) return false;
    if (sortedA[i].isModifiedByUser !== sortedB[i].isModifiedByUser) return false;
    if (sortedA[i].name !== sortedB[i].name) return false;
  }
  return true;
}

export async function getAssistants(): Promise<Assistant[]> {
  const storedAssistants = (await getItem<Assistant[]>(StorageKeys.ASSISTANTS)) || [];

  if (storedAssistants.length === 0) {
    await setItem(StorageKeys.ASSISTANTS, DEFAULT_ASSISTANTS);
    return DEFAULT_ASSISTANTS;
  }

  const storedAssistantsMap = new Map(storedAssistants.map((a) => [a.id, a]));
  const userCustomAssistants = storedAssistants.filter((a) => !a.isBuiltIn);

  const updatedDefaultAssistants = DEFAULT_ASSISTANTS.map((defaultAssistant) => {
    const existing = storedAssistantsMap.get(defaultAssistant.id);

    if (existing?.isBuiltIn && existing?.isModifiedByUser) {
      return existing;
    }

    if (existing?.isBuiltIn) {
      return { ...defaultAssistant, enabled: existing.enabled };
    }

    return defaultAssistant;
  });

  const finalAssistants = [...updatedDefaultAssistants, ...userCustomAssistants];

  if (!areAssistantsEqual(finalAssistants, storedAssistants)) {
    await setItem(StorageKeys.ASSISTANTS, finalAssistants);
  }

  return finalAssistants;
}

export async function saveAssistant(assistant: Assistant): Promise<void> {
  const assistants = await getAssistants();
  const index = assistants.findIndex((a) => a.id === assistant.id);

  if (assistant.isBuiltIn) {
    const defaultAssistant = DEFAULT_ASSISTANTS.find((a) => a.id === assistant.id);
    const keys = Object.keys(assistant).sort();
    const defaultKeys = Object.keys(defaultAssistant || {}).sort();
    const isModified =
      keys.length !== defaultKeys.length ||
      keys.some((k, i) => k !== defaultKeys[i]) ||
      JSON.stringify(assistant, keys) !== JSON.stringify(defaultAssistant, defaultKeys);
    assistant.isModifiedByUser = isModified;
  }

  if (index >= 0) {
    assistants[index] = { ...assistant, updatedAt: Date.now() };
  } else {
    assistants.push({ ...assistant, createdAt: Date.now(), updatedAt: Date.now() });
  }

  await setItem(StorageKeys.ASSISTANTS, assistants);
}

export async function deleteAssistant(assistantId: string): Promise<void> {
  const assistants = await getAssistants();
  const filtered = assistants.filter((a) => a.id !== assistantId);
  await setItem(StorageKeys.ASSISTANTS, filtered);
}

export async function toggleAssistant(assistantId: string, enabled: boolean): Promise<void> {
  const assistants = await getAssistants();
  const assistant = assistants.find((a) => a.id === assistantId);
  if (assistant) {
    assistant.enabled = enabled;
    assistant.updatedAt = Date.now();
    await setItem(StorageKeys.ASSISTANTS, assistants);
  }
}

export async function resetAssistant(assistantId: string): Promise<void> {
  const assistants = await getAssistants();
  const index = assistants.findIndex((a) => a.id === assistantId);
  if (index === -1) return;

  const defaultAssistant = DEFAULT_ASSISTANTS.find((a) => a.id === assistantId);
  if (!defaultAssistant) return;

  const enabledState = assistants[index].enabled;
  assistants[index] = { ...defaultAssistant, enabled: enabledState, isModifiedByUser: false };
  await setItem(StorageKeys.ASSISTANTS, assistants);
}
