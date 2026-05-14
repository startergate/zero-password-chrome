chrome.runtime.onMessage.addListener(
  (message: unknown, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    console.log('Content script received:', message);
    sendResponse({ ok: true });
    return true;
  }
);