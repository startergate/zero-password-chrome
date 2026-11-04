// content script ↔ background 사이에 오가는 메시지 형식

export interface GetRuleRequest {
  type: 'getRule';
  hostname: string;
}

export type GetRuleResponse =
  | { ok: true; domain: string; rule: unknown }
  | { ok: false; error: 'not_found' | 'network' };

export type Message = GetRuleRequest;

export function isGetRuleRequest(message: unknown): message is GetRuleRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { type?: unknown }).type === 'getRule' &&
    typeof (message as { hostname?: unknown }).hostname === 'string'
  );
}
