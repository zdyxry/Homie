import { describe, it, expect } from 'vitest';
import { RuntimeMessages, isRuntimeMessage } from './messages';

describe('isRuntimeMessage', () => {
  it('should return true for valid messages', () => {
    expect(isRuntimeMessage({ type: RuntimeMessages.TOGGLE_SUMMARY_PANEL })).toBe(true);
    expect(isRuntimeMessage({ type: RuntimeMessages.GET_TAB_INFO })).toBe(true);
    expect(isRuntimeMessage({ type: RuntimeMessages.OPEN_OPTIONS })).toBe(true);
    expect(isRuntimeMessage({ type: RuntimeMessages.SEARCH_HACKERNEWS, payload: 'url' })).toBe(true);
    expect(isRuntimeMessage({ type: RuntimeMessages.FETCH_HACKERNEWS_COMMENTS, payload: { storyId: '1' } })).toBe(true);
  });

  it('should return false for non-objects', () => {
    expect(isRuntimeMessage(null)).toBe(false);
    expect(isRuntimeMessage(undefined)).toBe(false);
    expect(isRuntimeMessage('string')).toBe(false);
    expect(isRuntimeMessage(123)).toBe(false);
  });

  it('should return false for objects without valid type', () => {
    expect(isRuntimeMessage({})).toBe(false);
    expect(isRuntimeMessage({ type: 'unknown' })).toBe(false);
    expect(isRuntimeMessage({ type: 123 })).toBe(false);
    expect(isRuntimeMessage({ foo: 'bar' })).toBe(false);
  });
});
