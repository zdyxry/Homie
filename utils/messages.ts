// Shared message contracts for runtime/content communication
export type RuntimeMessageType =
  | 'TOGGLE_SUMMARY_PANEL'
  | 'GET_TAB_INFO'
  | 'OPEN_OPTIONS'
  | 'SEARCH_HACKERNEWS'
  | 'FETCH_HACKERNEWS_COMMENTS'
  | 'GET_ALL_TABS'
  | 'GET_TAB_CONTENT';

export interface RuntimeMessage<T extends RuntimeMessageType = RuntimeMessageType> {
  type: T;
  // Allow optional payload per message type without forcing a shape
  payload?: unknown;
}

export const RuntimeMessages: Record<RuntimeMessageType, RuntimeMessageType> = {
  TOGGLE_SUMMARY_PANEL: 'TOGGLE_SUMMARY_PANEL',
  GET_TAB_INFO: 'GET_TAB_INFO',
  OPEN_OPTIONS: 'OPEN_OPTIONS',
  SEARCH_HACKERNEWS: 'SEARCH_HACKERNEWS',
  FETCH_HACKERNEWS_COMMENTS: 'FETCH_HACKERNEWS_COMMENTS',
  GET_ALL_TABS: 'GET_ALL_TABS',
  GET_TAB_CONTENT: 'GET_TAB_CONTENT',
};

export function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as RuntimeMessage).type === 'string'
  );
}
