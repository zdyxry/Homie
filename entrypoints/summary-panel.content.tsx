/// <reference types="wxt/vite-builder-env" />
import '@/assets/summary-panel.css';
import { createRoot } from 'react-dom/client';
import SummaryPanel from '~/components/SummaryPanel';
import browser from 'webextension-polyfill';
import { RuntimeMessages, isRuntimeMessage } from '~/utils/messages';
import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',

  async main(ctx) {
    console.log('Homie content script loaded');

    // Pending async check id shared so onRemove can clear it
    let _homiePendingCheck: number | null = null;

    // Create UI container
    // @ts-ignore
    const ui = await createShadowRootUi(ctx, {
      name: 'homie-panel',
      position: 'inline',
      onMount: (container: any) => {
        // Create root element
        const root = document.createElement('div');
        root.id = 'homie-root';
        container.append(root);

        // Fallback-aware layout adjustment
        // Strategy: Try width-based layout first (keeps centered `max-width` containers centered).
        // After applying it, detect if a prominent centered element shifted noticeably. If so,
        // revert to the legacy margin-right approach for compatibility with that page.

        const findCenteredCandidate = (): HTMLElement | null => {
          const els = Array.from(document.body.getElementsByTagName('*')) as HTMLElement[];
          let best: HTMLElement | null = null;
          let bestWidth = 0;
          const minWidth = Math.max(200, window.innerWidth * 0.2);

          for (const el of els) {
            try {
              const style = window.getComputedStyle(el);
              if (style.marginLeft === 'auto' && style.marginRight === 'auto') {
                const rect = el.getBoundingClientRect();
                const w = rect.width;
                if (w > bestWidth && w >= minWidth) {
                  bestWidth = w;
                  best = el;
                }
              }
            } catch (err) {
              // ignore cross-origin or other errors
            }
          }

          return best;
        };

        const applyMarginLayout = (width: number) => {
          // Legacy behavior: reserve space by shifting body content left with margin-right
          document.body.style.removeProperty('width');
          document.body.style.removeProperty('margin-left');
          document.body.style.transition = 'margin-right 0.3s ease-out';
          document.body.style.marginRight = `${width}px`;
          if (_homiePendingCheck) {
            clearTimeout(_homiePendingCheck);
            _homiePendingCheck = null;
          }
        };

        const applyWidthLayout = (width: number) => {
          // Use width-based layout adjustment to preserve centered layouts on the page.
          document.body.style.transition = 'width 0.3s ease-out, margin 0.3s ease-out';
          document.body.style.width = `calc(100% - ${width}px)`;
          document.body.style.marginLeft = '0';
          document.body.style.marginRight = `${width}px`;

          // Schedule detection check shortly after layout settles
          if (_homiePendingCheck) {
            clearTimeout(_homiePendingCheck);
          }
          const candidate = findCenteredCandidate();
          if (!candidate) {
            // no obvious centered element, skip detection
            return;
          }

          const viewportCenter = window.innerWidth / 2;

          _homiePendingCheck = window.setTimeout(() => {
            _homiePendingCheck = null;
            try {
              const afterRect = candidate.getBoundingClientRect();
              const afterCenter = afterRect.left + afterRect.width / 2;
              const shift = Math.abs(afterCenter - viewportCenter);
              const threshold = Math.max(12, window.innerWidth * 0.02); // px or 2% of width

              if (shift > threshold) {
                // Detected an unexpected shift — fall back to margin approach
                console.warn('Homie: centered content shifted by', shift, 'px after width layout; applying fallback margin layout.');
                applyMarginLayout(width);
              }
            } catch (err) {
              // ignore
            }
          }, 120);
        };

        const adjustPageLayout = (width: number) => {
          // Prefer width-based layout but allow fall back
          applyWidthLayout(width);
        };

        // Render React component
        const reactRoot = createRoot(root);
        reactRoot.render(<SummaryPanel onWidthChange={adjustPageLayout} />);

        return { reactRoot, adjustPageLayout };
      },
      onRemove: (mounted: any) => {
        mounted?.reactRoot?.unmount();
        // Restore original layout styles
        if (_homiePendingCheck !== null) {
          clearTimeout(_homiePendingCheck);
          _homiePendingCheck = null;
        }
        document.body.style.removeProperty('width');
        document.body.style.removeProperty('margin-left');
        document.body.style.removeProperty('margin-right');
        document.body.style.removeProperty('transition');
      },
    });

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!isRuntimeMessage(message)) {
        return true;
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
      return true;
    });

    // Don't auto-mount, wait for user action
    // ui.mount();
  },
});
