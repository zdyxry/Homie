import { defineContentScript } from "wxt/sandbox";

export default defineContentScript({
    matches: ["<all_urls>"],
    main() {
        // This script does nothing but ensure the extension can programmatically
        // inject scripts into any tab. The real work will be done by the
        // injected script in the background script.
    },
})
