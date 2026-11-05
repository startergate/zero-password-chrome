# 0password

비밀번호 입력란 옆에 사이트의 비밀번호 규칙을 보여주는 Chrome 확장 프로그램입니다.

## 개발 환경

```bash
npm install
npm run dev     # 개발 빌드 + 변경 감시 (dist/)
npm run build   # 프로덕션 빌드
bun test        # 단위 테스트
```

## 확장 프로그램 로드

1. `npm run dev` 로 `dist/` 를 만든다.
2. Chrome 에서 `chrome://extensions` 를 연다.
3. 오른쪽 위 **개발자 모드** 를 켠다.
4. **압축해제된 확장 프로그램을 로드합니다** 를 눌러 `dist/` 폴더를 고른다.

content script 만 바꿨다면 `npm run dev` 가 다시 빌드한 뒤 테스트 페이지를 새로고침하면 됩니다.
background 나 `manifest.json` 을 바꿨다면 `chrome://extensions` 에서 확장 프로그램의 새로고침 버튼을 눌러야 반영됩니다.

## 수동 테스트

```bash
bun run serve:test   # http://localhost:5174 (PORT 환경 변수로 바꿀 수 있음)
```

`test-pages/` 에 가입, 로그인, 비밀번호 변경, form 없는 SPA, 동적으로 나타나는 폼 페이지가 있고, 각 페이지에 기대 결과가 적혀 있습니다.

개발 빌드에서는 비밀번호 입력란 옆에 판별 결과 배지(`0pw: login · not_found`, `0pw: signup` 등)가 뜨고, 입력란에 `data-0password-kind` 속성이 붙습니다.
배지는 프로덕션 빌드에는 들어가지 않습니다.

## 규칙 조회

로그인 폼을 찾으면 content script 가 background 에 호스트 이름을 보내고, background 는 [`zero-password/lite`](https://www.npmjs.com/package/zero-password) 로 `https://0password.startergate.dev/api/<domain>` 에서 규칙을 받아옵니다. 가입·변경 화면은 사이트가 규칙을 직접 보여주므로 조회하지 않습니다.

- 받은 결과는 `chrome.storage.local` 에 하루 동안 캐시합니다. 규칙이 없다는 결과(404)도 캐시합니다.
- 네트워크·서버 오류는 캐시하지 않고 `network` 로 돌려주며, 다음 페이지 로드에서 다시 시도합니다.
- `localhost` 처럼 점이 없는 호스트는 요청 없이 `not_found` 입니다.

테스트 페이지는 localhost 에서 열리므로, 개발 빌드에서는 `<meta name="0password-test-domain" content="daum.net">` 가 있으면 그 도메인으로 조회합니다 (`test-pages/rule-found.html`). 프로덕션 빌드는 이 태그를 보지 않습니다.

캐시를 비우려면 확장 프로그램의 service worker DevTools 에서 `chrome.storage.local.clear()` 를 실행합니다.
