// 비밀번호 입력란이 어떤 폼에 속하는지 판별한다. DOM 에 의존하지 않는 순수 함수만 둔다.

export type FormKind = 'signup' | 'change' | 'login' | 'unknown';

export interface PasswordFieldContext {
  /** 이 입력란의 autocomplete 속성 (소문자) */
  autocomplete: string;
  /** 같은 폼(또는 묶음) 안의 다른 비밀번호 입력란들의 autocomplete 속성 */
  siblingAutocompletes: string[];
  /** 같은 폼 안의 보이는 비밀번호 입력란 개수 (자기 자신 포함) */
  passwordFieldCount: number;
  /** 입력란 자체의 name, id, placeholder, aria-label */
  fieldText: string;
  /** 폼을 제출하는 버튼의 문구 */
  submitText: string;
  /** 폼의 제목, 버튼 문구, action 주소, 페이지 경로 */
  formText: string;
}

const CHANGE_KEYWORDS = [
  '비밀번호 변경', '비밀번호변경', '비밀번호 재설정', '비밀번호재설정', '새 비밀번호', '새비밀번호',
  'change password', 'change-password', 'changepassword', 'reset password', 'reset-password',
  'resetpassword', 'new password', 'update password',
];

const SIGNUP_KEYWORDS = [
  '회원가입', '회원 가입', '가입하기', '가입', '계정 만들기', '계정만들기',
  'sign up', 'signup', 'sign-up', 'register', 'registration', 'join', 'create account',
  'create-account', 'create an account',
];

const LOGIN_KEYWORDS = ['로그인', 'log in', 'login', 'log-in', 'sign in', 'signin', 'sign-in'];

const NEW_FIELD_KEYWORDS = ['new', 'confirm', 'repeat', 'retype', 'again', 're-enter', '확인', '재입력', '새 비밀번호'];

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function classifyPasswordField(context: PasswordFieldContext): FormKind {
  const autocompletes = [context.autocomplete, ...context.siblingAutocompletes];
  const hasNew = autocompletes.some((value) => value.includes('new-password'));
  const hasCurrent = autocompletes.some((value) => value.includes('current-password'));

  // 1. autocomplete 힌트가 가장 정확하다
  if (hasNew) return hasCurrent ? 'change' : 'signup';

  const submitText = context.submitText.toLowerCase();
  const formText = context.formText.toLowerCase();
  const fieldText = context.fieldText.toLowerCase();

  // 2. 제출 버튼 문구. 로그인 화면에도 "회원가입" 버튼이 흔해서 폼 전체 문구보다 먼저 본다
  if (includesAny(submitText, CHANGE_KEYWORDS)) return 'change';
  if (includesAny(submitText, SIGNUP_KEYWORDS)) return 'signup';
  if (context.passwordFieldCount === 1 && includesAny(submitText, LOGIN_KEYWORDS)) return 'login';

  // 3. 폼 문구. 변경 문구에 "비밀번호" 가 들어가므로 변경을 먼저 본다
  if (includesAny(formText, CHANGE_KEYWORDS)) return 'change';
  if (includesAny(formText, SIGNUP_KEYWORDS)) return 'signup';

  // 4. 비밀번호 칸 개수: 3개면 현재/새/확인, 2개면 새/확인
  if (context.passwordFieldCount >= 3) return 'change';
  if (context.passwordFieldCount === 2) return hasCurrent ? 'change' : 'signup';

  // 5. 입력란 이름에 new/confirm 같은 단서
  if (includesAny(fieldText, NEW_FIELD_KEYWORDS)) return 'signup';

  if (hasCurrent || includesAny(formText, LOGIN_KEYWORDS)) return 'login';

  return 'unknown';
}

/** 규칙을 보여줄 폼인지. 로그인 폼에서는 규칙이 필요 없다. */
export function shouldShowRule(kind: FormKind): boolean {
  return kind === 'signup' || kind === 'change';
}
