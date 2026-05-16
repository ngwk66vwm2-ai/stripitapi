console.log("Background script loaded");

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("MESSAGE RECEIVED:", message);

  if (message.action === "openPreview") {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      const tabId = tabs[0].id;

      // Try sending directly first — if content.js was auto-injected by
      // the manifest, this just works.
      browser.tabs.sendMessage(tabId, { action: "startPreview" }, (response) => {
        if (browser.runtime.lastError) {
          // No content script in this tab (likely a LinkedIn SPA situation).
          // Inject it manually, then retry the message.
          console.log("Content script missing — injecting now");
          browser.tabs.executeScript(tabId, { file: "content.js" }, () => {
            if (browser.runtime.lastError) {
              console.error("Inject error:", browser.runtime.lastError.message);
              return;
            }
            setTimeout(() => {
              browser.tabs.sendMessage(tabId, { action: "startPreview" });
            }, 200);
          });
        }
      });
    });
    return true;
  }
});
