import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as historyStorage from './historyStorage';

vi.mock('./base', () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

import { getItem, setItem } from './base';

describe('historyStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save and retrieve history', async () => {
    vi.mocked(getItem).mockResolvedValue([]);
    const record = {
      id: 'h1',
      pageTitle: 'Test',
      pageUrl: 'https://example.com',
      modelName: 'M',
      modelId: 'm1',
      messages: [],
      createdAt: 1,
    };
    await historyStorage.saveHistory(record);
    expect(setItem).toHaveBeenCalledWith('conversationHistory', [record]);
  });

  it('should deduplicate by URL', async () => {
    const oldRecord = {
      id: 'h1',
      pageTitle: 'Old',
      pageUrl: 'https://example.com',
      modelName: 'M',
      modelId: 'm1',
      messages: [],
      createdAt: 1,
    };
    vi.mocked(getItem).mockResolvedValue([oldRecord]);
    const newRecord = { ...oldRecord, id: 'h2', pageTitle: 'New', createdAt: 2 };
    await historyStorage.saveHistory(newRecord);
    expect(setItem).toHaveBeenCalledWith('conversationHistory', [newRecord]);
  });

  it('should limit to 100 records', async () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      id: `h${i}`,
      pageTitle: `Page ${i}`,
      pageUrl: `https://example.com/${i}`,
      modelName: 'M',
      modelId: 'm1',
      messages: [],
      createdAt: i,
    }));
    vi.mocked(getItem).mockResolvedValue(records);
    const newRecord = {
      id: 'h100',
      pageTitle: 'New',
      pageUrl: 'https://example.com/new',
      modelName: 'M',
      modelId: 'm1',
      messages: [],
      createdAt: 100,
    };
    await historyStorage.saveHistory(newRecord);
    const callArgs = vi.mocked(setItem).mock.calls[0];
    expect(callArgs[1]).toHaveLength(100);
    expect(callArgs[1][0]).toEqual(newRecord);
  });

  it('should find history by URL', async () => {
    const record = {
      id: 'h1',
      pageTitle: 'Test',
      pageUrl: 'https://example.com',
      modelName: 'M',
      modelId: 'm1',
      messages: [],
      createdAt: 1,
    };
    vi.mocked(getItem).mockResolvedValue([record]);
    const found = await historyStorage.getHistoryByUrl('https://example.com');
    expect(found).toEqual(record);
  });

  it('should clear all history', async () => {
    await historyStorage.clearAllHistory();
    expect(setItem).toHaveBeenCalledWith('conversationHistory', []);
  });
});
