import browser from 'webextension-polyfill';
import type { RuntimeMessage } from './messages';

/**
 * Type-safe wrapper for browser.runtime.sendMessage.
 * Usage:
 *   const response = await sendMessage<SomeRequest, SomeResponse>({ type: '...', payload: ... });
 */
export async function sendMessage<TReq extends RuntimeMessage, TRes = unknown>(
  message: TReq
): Promise<TRes> {
  return browser.runtime.sendMessage(message) as Promise<TRes>;
}
