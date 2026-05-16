console.log("Background script loaded");

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("MESSAGE RECEIVED:", message);

  if (message.action === "openPreview") {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("Tabs found:", tabs);
      if (tabs[0]) {
        browser.tabs.executeScript(tabs[0].id, { file: "content.js" }, () => {
          if (browser.runtime.lastError) {
            console.error("Inject error:", browser.runtime.lastError.message);
          } else {
            console.log("Script injected successfully");
            setTimeout(() => {
              browser.tabs.sendMessage(tabs[0].id, { action: "startPreview" }, (response) => {
                console.log("Content script response:", response);
              });
            }, 200);
          }
        });
      }
    });
    return true;
  }
});
