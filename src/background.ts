import { isGetRuleRequest } from './messages';
import { lookupRule } from './rules';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    if (!isGetRuleRequest(message)) return false;
    lookupRule(message.hostname).then(sendResponse);
    // 비동기로 응답하므로 채널을 열어 둔다
    return true;
  }
);
