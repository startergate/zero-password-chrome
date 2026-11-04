import { GetRuleResponse, isGetRuleRequest } from './messages';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    if (!isGetRuleRequest(message)) return false;
    // TODO(#1): zero-password lite 버전으로 message.hostname 의 규칙 조회
    const response: GetRuleResponse = { ok: false, error: 'not_found' };
    sendResponse(response);
    return false;
  }
);
