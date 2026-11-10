# zero-password-chrome

0Password 의 크롬 익스텐션(MV3). 로그인 화면의 비밀번호 입력란에 그 사이트의 비밀번호 규칙을 보여주고, 입력하는 동안 규칙별 충족 여부를 표시한다.

- 기획 상세는 `docs/spec.md`, 화면 시안은 `docs/design/` 에 있다. 작업 전에 먼저 읽는다.
- 규칙 데이터와 lite 클라이언트는 zero-password-db, API 서버는 zero-password-api 저장소에 있다. 그쪽 동작을 바꿔야 하면 이 저장소에서 우회하지 말고 먼저 물어본다.

## 기본 규칙

- 대화, 이슈, PR 설명은 한국어. 코드 식별자는 영어, 주석은 기존 코드처럼 한국어.
- spec 에 없는 결정(화면 문구, 메시지 형식, 권한, 함수 시그니처 등)은 임의로 정하지 말고 먼저 물어본다. 정해지면 spec 을 먼저 고치고 구현한다.
- 입력 중인 비밀번호는 content script 밖으로 보내거나 저장하지 않는다. 로그·메시지·storage 어디에도 넣지 않는다.
- git flow (release 브랜치 없음): `main`, `develop`, `feature/*`, `fix/*`, `hotfix/*`. PR 은 `develop` 으로, 제목은 Conventional Commits (`feat:`, `fix:`, `docs:` …).
- 작업이 끝나면 `bun test` 와 `npm run build` 가 통과하는지 확인한다.

## 스택과 배포

- TypeScript + webpack (`npm run dev` 개발 빌드·감시, `npm run build` 프로덕션 빌드, 결과는 `dist/`).
- 테스트는 `bun test` (`test/`). 수동 테스트 페이지는 `bun run serve:test` (`test-pages/`).
- 규칙 조회는 npm `zero-password` 의 lite 진입점(`zero-password/lite`)을 쓴다. 기본 API 는 `https://0password.startergate.dev`.
- 배포는 크롬 웹스토어 (1.0 목표, 아직 등록 전).
- 개발 빌드에서만 켜지는 코드는 `__DEV__` 상수로 감싼다. 프로덕션 빌드에서 통째로 빠져야 한다.

## 핵심 구조

| 파일 | 역할 |
| --- | --- |
| `src/content.ts` | 비밀번호 입력란 찾기, 로그인 폼이면 background 에 규칙 요청, 규칙 패널 표시 |
| `src/detection.ts` | 입력란이 로그인/가입/변경 폼인지 판별하는 순수 함수 (`classifyPasswordField`, `shouldShowRule`) |
| `src/background.ts` | 메시지를 받아 규칙 조회 |
| `src/rules.ts` | lite 클라이언트로 규칙 조회·캐시 (`lookupRule`) |
| `src/messages.ts` | content/popup ↔ background 메시지 형식 |
| `src/popup.ts`, `src/popup.html` | 익스텐션 아이콘 팝업 |
| `src/devBadge.ts` | 개발 빌드 전용 판별 결과 배지 |
| `public/manifest.json` | manifest, 아이콘 |
