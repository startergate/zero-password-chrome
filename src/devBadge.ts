// 개발 빌드에서만 쓰는 판별 결과 배지. 입력란 옆에 FormKind 와 규칙 조회 결과를 띄운다.
// content.ts 에서 __DEV__ 일 때만 불러서 프로덕션 빌드에서는 통째로 빠진다.

import { FormKind } from './detection';
import { GetRuleResponse } from './messages';

const KIND_COLORS: Record<FormKind, string> = {
  signup: '#16a34a',
  change: '#d97706',
  login: '#2563eb',
  unknown: '#6b7280',
};

interface Badge {
  input: HTMLInputElement;
  host: HTMLElement;
}

const badges: Badge[] = [];

function place(badge: Badge): void {
  const rect = badge.input.getBoundingClientRect();
  // 입력란이 사라졌거나 숨겨지면 배지도 숨긴다
  const hidden = !badge.input.isConnected || badge.input.getClientRects().length === 0;
  setStyle(badge.host, 'display', hidden ? 'none' : 'block');
  setStyle(badge.host, 'top', `${rect.top + window.scrollY + rect.height / 2}px`);
  setStyle(badge.host, 'left', `${rect.right + window.scrollX + 6}px`);
}

// 값이 같을 때 다시 쓰면 MutationObserver 가 또 불려서 끝없이 돈다
function setStyle(el: HTMLElement, name: 'display' | 'top' | 'left', value: string): void {
  if (el.style[name] !== value) el.style[name] = value;
}

let placeScheduled = false;
function placeAll(): void {
  if (placeScheduled) return;
  placeScheduled = true;
  requestAnimationFrame(() => {
    placeScheduled = false;
    badges.forEach(place);
  });
}

// 모듈 최상단에서 리스너를 걸면 부수 효과로 남아 프로덕션 빌드에서 빠지지 않으므로 처음 쓸 때 건다
let listening = false;
function listen(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('resize', placeAll);
  window.addEventListener('scroll', placeAll, true);
  // 레이아웃이 바뀌는 경우(동적 폼 삽입 등)에도 위치를 다시 잡는다
  new MutationObserver(placeAll).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
}

function describe(response: GetRuleResponse): string {
  return response.ok ? `rule: ${response.domain}` : response.error;
}

/** 입력란 옆에 판별 결과 배지를 붙이고, 배지 문구를 바꾸는 함수를 돌려준다. */
export function showDetectionBadge(input: HTMLInputElement, kind: FormKind): (response: GetRuleResponse) => void {
  listen();
  input.setAttribute('data-0password-kind', kind);

  // 페이지 스타일이 배지에 영향을 주지 않도록 shadow root 안에 그린다
  const host = document.createElement('div');
  host.setAttribute('data-0password-badge', '');
  host.style.cssText = 'all: initial; position: absolute; z-index: 2147483647; pointer-events: none;';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    span {
      display: inline-block;
      transform: translateY(-50%);
      padding: 2px 6px;
      border-radius: 4px;
      background: ${KIND_COLORS[kind]};
      color: #fff;
      font: 600 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: nowrap;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  `;
  const label = document.createElement('span');
  label.textContent = `0pw: ${kind}`;
  shadow.append(style, label);
  document.body.append(host);

  const badge: Badge = { input, host };
  badges.push(badge);
  place(badge);

  return (response) => {
    label.textContent = `0pw: ${kind} · ${describe(response)}`;
  };
}
