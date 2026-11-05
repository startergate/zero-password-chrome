import { describe, expect, test } from 'bun:test';
import { createLiteClient, createMemoryStorage } from 'zero-password/lite';
import { lookupRule } from '../src/rules';

const daumRule = { length: { min: 8, max: 32 } };

function client(respond: (url: string) => Response | Promise<Response>) {
  const calls: string[] = [];
  const fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    return respond(url);
  }) as typeof globalThis.fetch;
  return { calls, client: createLiteClient({ storage: createMemoryStorage(), fetch }) };
}

describe('lookupRule', () => {
  test('규칙이 있으면 매칭된 도메인과 규칙을 돌려준다', async () => {
    const { client: c, calls } = client(() => Response.json({ domain: 'daum.net', rule: daumRule }));
    expect(await lookupRule(c, 'logins.daum.net')).toEqual({ ok: true, domain: 'daum.net', rule: daumRule });
    expect(calls).toEqual(['https://0password.startergate.dev/api/logins.daum.net']);
  });

  test('404 는 not_found 이고 캐시되어 다시 요청하지 않는다', async () => {
    const { client: c, calls } = client(() => new Response('not found', { status: 404 }));
    expect(await lookupRule(c, 'example.org')).toEqual({ ok: false, error: 'not_found' });
    expect(await lookupRule(c, 'example.org')).toEqual({ ok: false, error: 'not_found' });
    expect(calls.length).toBe(1);
  });

  test('규칙도 캐시되어 다시 요청하지 않는다', async () => {
    const { client: c, calls } = client(() => Response.json({ domain: 'daum.net', rule: daumRule }));
    await lookupRule(c, 'daum.net');
    expect((await lookupRule(c, 'daum.net')).ok).toBe(true);
    expect(calls.length).toBe(1);
  });

  test('localhost 처럼 조회할 수 없는 호스트는 요청 없이 not_found', async () => {
    const { client: c, calls } = client(() => Response.json({}));
    expect(await lookupRule(c, 'localhost')).toEqual({ ok: false, error: 'not_found' });
    expect(calls.length).toBe(0);
  });

  test('네트워크 오류는 network 이고 캐시하지 않아 다음에 다시 시도한다', async () => {
    let online = false;
    const { client: c, calls } = client(() => {
      if (!online) throw new TypeError('Failed to fetch');
      return Response.json({ domain: 'daum.net', rule: daumRule });
    });
    expect(await lookupRule(c, 'daum.net')).toEqual({ ok: false, error: 'network' });
    online = true;
    expect((await lookupRule(c, 'daum.net')).ok).toBe(true);
    expect(calls.length).toBe(2);
  });

  test('서버 오류(5xx)도 network', async () => {
    const { client: c } = client(() => new Response('oops', { status: 500 }));
    expect(await lookupRule(c, 'daum.net')).toEqual({ ok: false, error: 'network' });
  });
});
