import { beforeEach, describe, expect, mock, test } from 'bun:test';

// rules.ts 가 만드는 lite 클라이언트를 가짜 fetch 와 메모리 저장소를 쓰는 클라이언트로 바꾼다.
// 실제 모듈은 Bun 에서 ~/.cache 에 파일을 쓰므로 테스트에서는 쓰지 않는다.
const lite = await import('zero-password/lite');
// mock.module 은 이미 불러온 모듈도 바꾸므로 진짜 함수를 먼저 잡아 둔다
const { createLiteClient: realCreateLiteClient, createMemoryStorage } = lite;

let respond: (url: string) => Response | Promise<Response>;
let calls: string[];
let storage = createMemoryStorage();

const fakeFetch = (async (input: string | URL | Request) => {
  const url = String(input);
  calls.push(url);
  return respond(url);
}) as typeof fetch;

mock.module('zero-password/lite', () => ({
  ...lite,
  // 테스트마다 저장소를 새로 만들기 때문에 호출할 때마다 클라이언트를 만든다
  createLiteClient: () => ({
    findRule: (domain: string) => realCreateLiteClient({ storage, fetch: fakeFetch }).findRule(domain),
    getRule: (domain: string) => realCreateLiteClient({ storage, fetch: fakeFetch }).getRule(domain),
  }),
}));

const { lookupRule } = await import('../src/rules');

const daumRule = { length: { min: 8, max: 32 } };

beforeEach(() => {
  calls = [];
  storage = createMemoryStorage();
});

describe('lookupRule', () => {
  test('규칙이 있으면 매칭된 도메인과 규칙을 돌려준다', async () => {
    respond = () => Response.json({ domain: 'daum.net', rule: daumRule });
    expect(await lookupRule('logins.daum.net')).toEqual({ ok: true, domain: 'daum.net', rule: daumRule });
    expect(calls).toEqual(['https://0password.startergate.dev/api/logins.daum.net']);
  });

  test('404 는 not_found 이고 캐시되어 다시 요청하지 않는다', async () => {
    respond = () => new Response('not found', { status: 404 });
    expect(await lookupRule('example.org')).toEqual({ ok: false, error: 'not_found' });
    expect(await lookupRule('example.org')).toEqual({ ok: false, error: 'not_found' });
    expect(calls.length).toBe(1);
  });

  test('규칙도 캐시되어 다시 요청하지 않는다', async () => {
    respond = () => Response.json({ domain: 'daum.net', rule: daumRule });
    await lookupRule('daum.net');
    expect((await lookupRule('daum.net')).ok).toBe(true);
    expect(calls.length).toBe(1);
  });

  test('localhost 처럼 조회할 수 없는 호스트는 요청 없이 not_found', async () => {
    respond = () => Response.json({});
    expect(await lookupRule('localhost')).toEqual({ ok: false, error: 'not_found' });
    expect(calls.length).toBe(0);
  });

  test('네트워크 오류는 network 이고 캐시하지 않아 다음에 다시 시도한다', async () => {
    let online = false;
    respond = () => {
      if (!online) throw new TypeError('Failed to fetch');
      return Response.json({ domain: 'daum.net', rule: daumRule });
    };
    expect(await lookupRule('daum.net')).toEqual({ ok: false, error: 'network' });
    online = true;
    expect((await lookupRule('daum.net')).ok).toBe(true);
    expect(calls.length).toBe(2);
  });

  test('서버 오류(5xx)도 network', async () => {
    respond = () => new Response('oops', { status: 500 });
    expect(await lookupRule('daum.net')).toEqual({ ok: false, error: 'network' });
  });
});
