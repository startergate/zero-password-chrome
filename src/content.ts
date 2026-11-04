import { classifyPasswordField, FormKind, PasswordFieldContext, shouldShowRule } from './detection';
import { GetRuleRequest, GetRuleResponse } from './messages';

const MAX_TEXT_LENGTH = 2000;

// 이미 판별한 입력란. 같은 입력란을 다시 처리하지 않는다.
const processed = new WeakSet<HTMLInputElement>();

// 한 페이지에서는 같은 호스트의 규칙을 한 번만 요청한다.
let rulePromise: Promise<GetRuleResponse> | null = null;

function isVisible(input: HTMLInputElement): boolean {
  return input.getClientRects().length > 0 && getComputedStyle(input).visibility !== 'hidden';
}

// form 태그가 없는 SPA 화면도 있어서, 비밀번호 칸을 감싸는 가까운 묶음을 폼으로 본다
function findContainer(input: HTMLInputElement): ParentNode {
  return input.form ?? input.closest('form, [role="form"], dialog, [role="dialog"], main') ?? document.body;
}

function readText(container: ParentNode): string {
  const parts: string[] = [];
  container.querySelectorAll('h1, h2, h3, legend, button, input[type="submit"], [role="button"]').forEach((el) => {
    parts.push(el instanceof HTMLInputElement ? el.value : el.textContent ?? '');
  });
  if (container instanceof HTMLFormElement) parts.push(container.getAttribute('action') ?? '');
  parts.push(location.pathname, document.title);
  return parts.join(' ').replace(/\s+/g, ' ').slice(0, MAX_TEXT_LENGTH);
}

function readSubmitText(input: HTMLInputElement, container: ParentNode): string {
  const submit =
    input.form?.querySelector<HTMLElement>('button[type="submit"], input[type="submit"], button:not([type])') ??
    container.querySelector<HTMLElement>('button[type="submit"], input[type="submit"]');
  if (!submit) return '';
  return submit instanceof HTMLInputElement ? submit.value : submit.textContent ?? '';
}

function buildContext(input: HTMLInputElement): PasswordFieldContext {
  const container = findContainer(input);
  const passwordFields = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="password"]')).filter(
    isVisible,
  );
  return {
    autocomplete: input.autocomplete.toLowerCase(),
    siblingAutocompletes: passwordFields.filter((field) => field !== input).map((field) => field.autocomplete.toLowerCase()),
    passwordFieldCount: Math.max(passwordFields.length, 1),
    fieldText: [input.name, input.id, input.placeholder, input.getAttribute('aria-label') ?? ''].join(' '),
    submitText: readSubmitText(input, container).trim(),
    formText: readText(container),
  };
}

function requestRule(): Promise<GetRuleResponse> {
  if (!rulePromise) {
    const request: GetRuleRequest = { type: 'getRule', hostname: location.hostname };
    rulePromise = chrome.runtime
      .sendMessage<GetRuleRequest, GetRuleResponse>(request)
      .catch((): GetRuleResponse => ({ ok: false, error: 'network' }));
  }
  return rulePromise;
}

function handlePasswordField(input: HTMLInputElement, kind: FormKind): void {
  if (!shouldShowRule(kind)) return;
  requestRule().then((response) => {
    // 규칙 표시 UI 는 #3 에서 붙인다
    console.debug('[0password]', kind, input, response);
  });
}

function scan(): void {
  document.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input) => {
    if (processed.has(input) || !isVisible(input)) return;
    processed.add(input);
    handlePasswordField(input, classifyPasswordField(buildContext(input)));
  });
}

// DOM 변경이 몰릴 때 한 번만 다시 훑는다
let scanScheduled = false;
function scheduleScan(): void {
  if (scanScheduled) return;
  scanScheduled = true;
  setTimeout(() => {
    scanScheduled = false;
    scan();
  }, 200);
}

scan();
new MutationObserver(scheduleScan).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  // "비밀번호 보기" 토글이나 숨겨진 단계가 나타나는 경우
  attributeFilter: ['type', 'style', 'class', 'hidden'],
});
