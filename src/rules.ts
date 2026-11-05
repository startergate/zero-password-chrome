// background 에서 쓰는 규칙 조회. zero-password lite 클라이언트로 API 에서 규칙을 받아온다.
// 클라이언트는 받은 결과(규칙 없음 포함)를 chrome.storage.local 에 하루 동안 캐시하고,
// 네트워크·서버 오류는 캐시하지 않아 다음 요청에서 다시 시도한다.

import { createLiteClient } from 'zero-password/lite';
import { GetRuleResponse } from './messages';

// 기본값: https://0password.startergate.dev, chrome.storage.local 캐시, 하루 동안 유효
const client = createLiteClient();

export async function lookupRule(hostname: string): Promise<GetRuleResponse> {
  try {
    const match = await client.findRule(hostname);
    if (!match) return { ok: false, error: 'not_found' };
    return { ok: true, domain: match.domain, rule: match.rule };
  } catch (error) {
    console.warn('[0password] 규칙 조회 실패', hostname, error);
    return { ok: false, error: 'network' };
  }
}
