# ESLint 설정 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 ESLint 설정 및 규칙에 대한 가이드입니다.

---

## 1. ESLint 설정 파일

**위치**: `web/eslint.config.mjs`

**사용 중인 설정**:
- Next.js ESLint 설정 (`eslint-config-next`)
- Prettier 통합 (`eslint-plugin-prettier`)
- TypeScript 지원 (`@typescript-eslint`)

---

## 2. 주요 규칙

### 2.1 라인 길이 제한

**규칙**: `max-len`

**설정**:
- 최대 라인 길이: 100자
- URL, 문자열 리터럴, 템플릿 리터럴 제외

**예시**:
```typescript
// ✅ 올바른 예시 (100자 이하)
const message = 'This is a short message';

// ✅ 긴 문자열은 제외됨
const url = 'https://very-long-url-that-exceeds-100-characters.com/very-long-path/very-long-resource';

// ❌ 잘못된 예시 (100자 초과)
const message = 'This is a very long message that exceeds 100 characters and should be split into multiple lines';
```

---

### 2.2 TypeScript `any` 타입 금지

**규칙**: `@typescript-eslint/no-explicit-any`

**설정**: `error` (오류로 처리)

**예시**:
```typescript
// ✅ 올바른 예시
function processData(data: unknown): void {
  if (typeof data === 'string') {
    console.log(data);
  }
}

// ❌ 잘못된 예시 (ESLint 오류 발생)
function processData(data: any): void {
  console.log(data);
}
```

**대안**:
- `unknown`: 타입을 알 수 없는 경우
- `Record<string, unknown>`: 객체 타입이 불명확한 경우
- 타입 가드 사용

---

### 2.3 미사용 변수 경고

**규칙**: `@typescript-eslint/no-unused-vars`

**설정**: `warn` (경고만 표시)

**예외**:
- `_` 접두사가 있는 변수/매개변수는 무시

**예시**:
```typescript
// ✅ 올바른 예시
function processData(data: Client, _options: Options) {
  // options는 사용하지 않지만 _ 접두사로 무시됨
  return data;
}

// ✅ 미사용 변수 경고
const unused = 'test';  // ESLint 경고 발생

// ❌ 잘못된 예시
function processData(data: Client, options: Options) {
  // options 미사용으로 경고 발생
  return data;
}
```

---

## 3. Prettier 통합

**규칙**: `eslint-plugin-prettier`

**설정**: Prettier와 ESLint 통합하여 코드 포맷팅 오류를 ESLint 오류로 표시

**사용 방법**:
```bash
# ESLint 실행 시 Prettier 규칙도 함께 검사
pnpm lint

# Prettier 자동 수정
pnpm format
```

---

## 4. Next.js 규칙

**규칙**: `eslint-config-next`

**포함된 규칙**:
- React Hooks 규칙
- Next.js 특정 규칙 (Image 컴포넌트, Link 컴포넌트 등)
- TypeScript 규칙

---

## 5. ESLint 실행 방법

### 5.1 개발 중 실행

```bash
# 프로젝트 루트에서
cd web

# ESLint 검사 실행
pnpm lint

# 자동 수정 가능한 문제 수정
pnpm lint --fix
```

### 5.2 CI/CD에서 실행

GitHub Actions에서 자동 실행:
```yaml
- name: Run linter
  run: pnpm --filter web lint
```

---

## 6. 규칙 커스터마이징

### 6.1 새로운 규칙 추가

`web/eslint.config.mjs` 파일의 `rules` 섹션에 추가:

```typescript
{
  rules: {
    // 기존 규칙...
    
    // 새로운 규칙 추가
    'new-rule': 'error',
  },
}
```

### 6.2 규칙 비활성화

특정 파일이나 라인에서 규칙 비활성화:

```typescript
// 전체 파일에서 규칙 비활성화
/* eslint-disable @typescript-eslint/no-explicit-any */

// 특정 라인에서만 비활성화
const data: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
```

---

## 7. 규칙 위반 시 대응

### 7.1 자동 수정

```bash
# 자동 수정 가능한 문제 수정
pnpm lint --fix
```

### 7.2 수동 수정

ESLint 오류 메시지를 확인하고 수동으로 수정:

```bash
# 오류 상세 정보 확인
pnpm lint
```

---

## 8. 참고 자료

- [ESLint 공식 문서](https://eslint.org/docs/latest/)
- [TypeScript ESLint 규칙](https://typescript-eslint.io/rules/)
- [Next.js ESLint 설정](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- [Prettier 통합 가이드](https://github.com/prettier/eslint-plugin-prettier)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

