import { createLiteClient } from 'zero-password/lite';
import { isGetRuleRequest } from './messages';
import { lookupRule } from './rules';

// 기본값: https://0password.startergate.dev, chrome.storage.local 캐시, 하루 동안 유효
const client = createLiteClient();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    if (!isGetRuleRequest(message)) return false;
    lookupRule(client, message.hostname).then(sendResponse);
    // 비동기로 응답하므로 채널을 열어 둔다
    return true;
  }
);
