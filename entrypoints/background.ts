// Background service worker for Homie
import browser from 'webextension-polyfill';
import { RuntimeMessages, type RuntimeMessage } from '~/utils/messages';
import { findHackerNewsDiscussion, getHackerNewsDiscussionText } from '~/utils/hackernews';

export default defineBackground(() => {
  console.log('Homie background script loaded');

  // Handle extension icon click
  browser.action.onClicked.addListener(async (tab) => {
    console.log('Extension icon clicked, tab:', tab);
    if (tab.id) {
      try {
        // Try to send message to content script
        const message: RuntimeMessage = { type: RuntimeMessages.TOGGLE_SUMMARY_PANEL };
        await browser.tabs.sendMessage(tab.id, message);
        console.log('Message sent successfully');
      } catch (error) {
        console.error('Failed to send message to content script:', error);
        console.log('Content script not found, injecting manually...');

        // Inject content script manually if not already injected
        try {
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-scripts/summary-panel.js'],
          });
          console.log('Content script injected successfully');

          // Wait a bit for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 100));

          // Try to send message again
          await browser.tabs.sendMessage(tab.id, {
            type: RuntimeMessages.TOGGLE_SUMMARY_PANEL,
          });
          console.log('Message sent after injection');
        } catch (injectError) {
          console.error('Failed to inject content script:', injectError);
        }
      }
    }
  });

  // Handle messages from content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object' || !(message as RuntimeMessage).type) {
      return false;
    }

    console.log('Background received message:', message);

    switch (message.type) {
      case RuntimeMessages.GET_TAB_INFO:
        if (sender.tab) {
          sendResponse({
            url: sender.tab.url,
            title: sender.tab.title,
          });
        }
        break;

      case RuntimeMessages.OPEN_OPTIONS:
        // Use chrome.tabs.create to open options page in a new tab
        browser.tabs.create({
          url: browser.runtime.getURL('settings.html')
        });
        sendResponse({ success: true });
        break;

      case RuntimeMessages.SEARCH_HACKERNEWS:
        // 搜索 HackerNews 讨论
        (async () => {
          try {
            const url = message.payload as string;
            if (!url) {
              sendResponse({ success: false, error: 'URL is required' });
              return;
            }

            const discussion = await findHackerNewsDiscussion(url);
            sendResponse({ success: true, discussion });
          } catch (error) {
            console.error('Failed to search HackerNews:', error);
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })();
        return true; // Keep message channel open for async response
        break;

      case RuntimeMessages.FETCH_HACKERNEWS_COMMENTS:
        // 获取 HackerNews 评论
        (async () => {
          try {
            const payload = message.payload as { storyId: string; originalUrl?: string };
            if (!payload?.storyId) {
              sendResponse({ success: false, error: 'Story ID is required' });
              return;
            }

            const discussionText = await getHackerNewsDiscussionText(payload.storyId, payload.originalUrl);
            sendResponse({ success: true, discussionText });
          } catch (error) {
            console.error('Failed to fetch HackerNews comments:', error);
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })();
        return true; // Keep message channel open for async response
        break;

      default:
        break;
    }

    return true; // Keep message channel open for async response
  });
});
