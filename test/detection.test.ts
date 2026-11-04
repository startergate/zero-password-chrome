import { describe, expect, test } from 'bun:test';
import { classifyPasswordField, PasswordFieldContext, shouldShowRule } from '../src/detection';

function context(overrides: Partial<PasswordFieldContext>): PasswordFieldContext {
  return {
    autocomplete: '',
    siblingAutocompletes: [],
    passwordFieldCount: 1,
    fieldText: '',
    submitText: '',
    formText: '',
    ...overrides,
  };
}

describe('classifyPasswordField', () => {
  test('autocomplete new-password 는 가입', () => {
    expect(classifyPasswordField(context({ autocomplete: 'new-password' }))).toBe('signup');
  });

  test('new-password 와 current-password 가 같이 있으면 변경', () => {
    expect(
      classifyPasswordField(context({ autocomplete: 'new-password', siblingAutocompletes: ['current-password'] })),
    ).toBe('change');
  });

  test('current-password 하나뿐이면 로그인', () => {
    expect(classifyPasswordField(context({ autocomplete: 'current-password' }))).toBe('login');
  });

  test('로그인 버튼 옆에 회원가입 버튼이 있어도 로그인', () => {
    expect(classifyPasswordField(context({ submitText: '로그인', formText: '로그인 회원가입 아이디 찾기' }))).toBe(
      'login',
    );
  });

  test('제출 버튼이 가입이면 가입', () => {
    expect(classifyPasswordField(context({ submitText: 'Sign up' }))).toBe('signup');
  });

  test('폼 문구에 비밀번호 변경이 있으면 변경', () => {
    expect(classifyPasswordField(context({ formText: '비밀번호 변경 확인' }))).toBe('change');
  });

  test('폼 문구가 회원가입이면 가입', () => {
    expect(classifyPasswordField(context({ formText: '회원가입 /join' }))).toBe('signup');
  });

  test('비밀번호 칸이 2개면 가입, 3개면 변경', () => {
    expect(classifyPasswordField(context({ passwordFieldCount: 2 }))).toBe('signup');
    expect(classifyPasswordField(context({ passwordFieldCount: 3 }))).toBe('change');
  });

  test('입력란 이름에 confirm 이 있으면 가입', () => {
    expect(classifyPasswordField(context({ fieldText: 'password_confirm' }))).toBe('signup');
  });

  test('단서가 없으면 unknown', () => {
    expect(classifyPasswordField(context({ fieldText: 'pw' }))).toBe('unknown');
  });
});

test('shouldShowRule 은 가입·변경 폼에서만 true', () => {
  expect(shouldShowRule('signup')).toBe(true);
  expect(shouldShowRule('change')).toBe(true);
  expect(shouldShowRule('login')).toBe(false);
  expect(shouldShowRule('unknown')).toBe(false);
});
