import '@/assets/summary-panel.css';
import { createRoot } from 'react-dom/client';
import SummaryPanel from '~/components/SummaryPanel';
import browser from 'webextension-polyfill';
import { RuntimeMessages, isRuntimeMessage } from '~/utils/messages';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',

  async main(ctx) {
    console.log('Homie content script loaded');

    // Create UI container
    const ui = await createShadowRootUi(ctx, {
      name: 'homie-panel',
      position: 'inline',
      onMount: (container) => {
        // Create root element
        const root = document.createElement('div');
        root.id = 'homie-root';
        container.append(root);

        const adjustPageLayout = (width: number) => {
          document.body.style.transition = 'margin-right 0.3s ease-out';
          document.body.style.marginRight = `${width}px`;
        };

        // Render React component
        const reactRoot = createRoot(root);
        reactRoot.render(<SummaryPanel onWidthChange={adjustPageLayout} />);

        return { reactRoot, adjustPageLayout };
      },
      onRemove: (mounted) => {
        mounted?.reactRoot?.unmount();
        document.body.style.marginRight = '0px';
        document.body.style.removeProperty('transition');
      },
    });

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!isRuntimeMessage(message)) {
        return false;
      }

      console.log('Content script received message:', message);

      try {
        switch (message.type) {
          case RuntimeMessages.TOGGLE_SUMMARY_PANEL:
            console.log('Toggling panel, current mounted state:', ui.mounted);
            // Toggle panel visibility
            if (ui.mounted) {
              ui.remove();
              console.log('Panel removed');
            } else {
              ui.mount();
              console.log('Panel mounted');
            }
            sendResponse({ success: true });
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: String(error) });
      }
      return true; // Keep the message channel open for async response
    });

    // Don't auto-mount, wait for user action
    // ui.mount();
  },
});
