chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(
  (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    console.log('Message received:', message, 'from:', sender.tab?.url);
    sendResponse({ ok: true });
    return true;
  }
);