# AT-CMP 코딩 표준 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 코드 품질과 일관성을 유지하기 위한 코딩 표준 가이드입니다.

---

## 1. 명명 규칙 (Naming Conventions)

### 1.1 파일명 규칙

**규칙**: `kebab-case` 사용

**예시**:
```typescript
// ✅ 올바른 예시
user-profile.tsx
client-form.tsx
api-client.ts
consultation-timeline.tsx

// ❌ 잘못된 예시
UserProfile.tsx      // PascalCase
userProfile.tsx     // camelCase
user_profile.tsx    // snake_case
```

**특수 케이스**:
- React 컴포넌트 파일: `kebab-case.tsx` (예: `client-form.tsx`)
- 유틸리티 함수: `kebab-case.ts` (예: `format-date.ts`)
- 타입 정의: `kebab-case.ts` (예: `client-types.ts`)
- 테스트 파일: `*.test.ts` 또는 `*.spec.ts` (예: `client.test.ts`)

---

### 1.2 변수 및 함수명 규칙

**규칙**: `camelCase` 사용

**예시**:
```typescript
// ✅ 올바른 예시
const userName = '홍길동';
const getUserProfile = () => { /* ... */ };
const isActive = true;
const clientList = [];

// ❌ 잘못된 예시
const user_name = '홍길동';      // snake_case
const UserName = '홍길동';      // PascalCase
const user-name = '홍길동';     // kebab-case (변수명 불가)
```

**특수 케이스**:
- Boolean 변수: `is`, `has`, `should` 접두사 사용
  ```typescript
  const isActive = true;
  const hasPermission = false;
  const shouldValidate = true;
  ```
- 이벤트 핸들러: `handle` 접두사 사용
  ```typescript
  const handleSubmit = () => { /* ... */ };
  const handleClick = () => { /* ... */ };
  ```

---

### 1.3 타입 및 인터페이스명 규칙

**규칙**: `PascalCase` 사용

**예시**:
```typescript
// ✅ 올바른 예시
interface UserProfile {
  name: string;
  email: string;
}

type ClientStatus = 'active' | 'inactive' | 'discharged';

class ApiClient {
  // ...
}

// ❌ 잘못된 예시
interface userProfile { /* ... */ }  // camelCase
type client_status = 'active' | 'inactive';  // snake_case
```

**특수 케이스**:
- 제네릭 타입: `T`, `U`, `V` 등의 단일 대문자 사용 또는 설명적 이름
  ```typescript
  function processData<T>(data: T): T {
    return data;
  }
  
  function merge<First, Second>(first: First, second: Second) {
    // ...
  }
  ```

---

### 1.4 상수명 규칙

**규칙**: `UPPER_SNAKE_CASE` 사용

**예시**:
```typescript
// ✅ 올바른 예시
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;

// 객체 형태의 상수는 camelCase로 시작하고 값은 UPPER_SNAKE_CASE
const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

// ❌ 잘못된 예시
const maxRetries = 3;           // camelCase
const MaxRetries = 3;           // PascalCase
const max_retries = 3;          // snake_case
```

**특수 케이스**:
- React 컴포넌트 내부 상수: `camelCase` 사용 (컴포넌트 내부에서만 사용)
  ```typescript
  const ClientForm = () => {
    const maxLength = 100;  // 컴포넌트 내부 상수
    // ...
  };
  ```

---

### 1.5 컴포넌트명 규칙

**규칙**: `PascalCase` 사용

**예시**:
```typescript
// ✅ 올바른 예시
export const ClientForm = () => {
  // ...
};

export const ConsultationTimeline = () => {
  // ...
};

// ❌ 잘못된 예시
export const clientForm = () => { /* ... */ };  // camelCase
export const client-form = () => { /* ... */ };  // kebab-case
```

---

### 1.6 API 엔드포인트명 규칙

**규칙**: `kebab-case` 사용

**예시**:
```typescript
// ✅ 올바른 예시
POST /api/clients
GET /api/clients/:id
PUT /api/consultations/:id
DELETE /api/assessments/:id

// ❌ 잘못된 예시
POST /api/userProfile      // camelCase
POST /api/user_profile     // snake_case
```

---

## 2. TypeScript 타입 규칙

### 2.1 `any` 타입 금지

**규칙**: `any` 타입 사용 금지

**예시**:
```typescript
// ✅ 올바른 예시
function processData(data: unknown): void {
  if (typeof data === 'string') {
    // 타입 가드 사용
    console.log(data.toUpperCase());
  }
}

function parseJSON(json: string): Record<string, unknown> {
  return JSON.parse(json);
}

// ❌ 잘못된 예시
function processData(data: any): void {  // any 사용 금지
  console.log(data);
}
```

**대안**:
- `unknown`: 타입을 알 수 없는 경우
- `Record<string, unknown>`: 객체 타입이 불명확한 경우
- 타입 가드 사용: `typeof`, `instanceof`, 사용자 정의 타입 가드

---

### 2.2 타입 추론 활용

**규칙**: 가능한 경우 타입 추론 활용, 명시적 타입은 필요한 경우만 사용

**예시**:
```typescript
// ✅ 올바른 예시 (타입 추론 활용)
const userName = '홍길동';  // string으로 추론
const age = 30;            // number로 추론

// 명시적 타입이 필요한 경우
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ 불필요한 타입 명시
const userName: string = '홍길동';  // 타입 추론 가능
```

---

### 2.3 인터페이스 vs 타입 별칭

**규칙**: 확장 가능성이 있는 경우 `interface`, 합성 타입의 경우 `type` 사용

**예시**:
```typescript
// ✅ interface 사용 (확장 가능)
interface User {
  name: string;
  email: string;
}

interface Admin extends User {
  permissions: string[];
}

// ✅ type 사용 (합성 타입)
type Status = 'active' | 'inactive' | 'pending';
type UserWithStatus = User & { status: Status };

// ❌ 불필요한 interface 사용
interface Status {
  value: 'active' | 'inactive';  // type이 더 적합
}
```

---

## 3. 코드 스타일 규칙

### 3.1 들여쓰기 및 공백

**규칙**: 2 스페이스 사용 (탭 금지)

**예시**:
```typescript
// ✅ 올바른 예시
function example() {
  if (condition) {
    return true;
  }
}

// ❌ 잘못된 예시 (탭 사용)
function example() {
	if (condition) {
		return true;
	}
}
```

---

### 3.2 라인 길이

**규칙**: 최대 100자 (ESLint `max-len` 규칙 적용)

**예시**:
```typescript
// ✅ 올바른 예시 (100자 이하)
const message = 'This is a short message';

// 긴 라인은 여러 줄로 분리
const longMessage = 
  'This is a very long message that exceeds 100 characters ' +
  'so it should be split across multiple lines';

// ❌ 잘못된 예시 (100자 초과)
const message = 'This is a very long message that exceeds 100 characters and should be split';
```

**예외**:
- URL, 긴 문자열 리터럴: 제외
- ESLint 설정에서 `ignoreUrls`, `ignoreStrings` 활성화

---

### 3.3 세미콜론

**규칙**: 세미콜론 사용 (Prettier가 자동 관리)

**예시**:
```typescript
// ✅ 올바른 예시
const name = '홍길동';
const age = 30;

function greet() {
  console.log('Hello');
}
```

---

### 3.4 따옴표

**규칙**: 작은따옴표(`'`) 사용 (Prettier 설정)

**예시**:
```typescript
// ✅ 올바른 예시
const message = 'Hello, World';
const name = '홍길동';

// ❌ 잘못된 예시
const message = "Hello, World";  // 큰따옴표
```

---

## 4. 파일 구조 규칙

### 4.1 디렉토리 구조

```
web/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 인증 관련 라우트 그룹
│   ├── api/               # API Routes
│   └── [feature]/         # 기능별 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   └── [feature]/        # 기능별 컴포넌트
├── lib/                   # 유틸리티 함수
├── config/                # 설정 파일
├── types/                 # TypeScript 타입 정의
└── hooks/                 # Custom React Hooks
```

---

### 4.2 파일명 규칙

**컴포넌트 파일**:
- 단일 컴포넌트: `component-name.tsx` (예: `client-form.tsx`)
- 여러 컴포넌트가 있는 경우: `index.tsx` 또는 `component-name.tsx`

**유틸리티 파일**:
- `utility-name.ts` (예: `format-date.ts`, `validate-email.ts`)

**타입 정의 파일**:
- `types.ts` 또는 `feature-name-types.ts` (예: `client-types.ts`)

---

## 5. 코드 품질 규칙

### 5.1 함수 규칙

**함수 길이**: 최대 50줄 (복잡한 경우 함수 분리)

**예시**:
```typescript
// ✅ 올바른 예시 (간단한 함수)
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 복잡한 함수는 분리
function processClientData(client: Client): ProcessedClient {
  const validated = validateClient(client);
  const enriched = enrichClientData(validated);
  return transformClient(enriched);
}

// ❌ 잘못된 예시 (너무 긴 함수)
function processClientData(client: Client): ProcessedClient {
  // 100줄 이상의 코드...
}
```

---

### 5.2 변수 선언

**규칙**: `const` 우선 사용, 변경이 필요한 경우만 `let` 사용

**예시**:
```typescript
// ✅ 올바른 예시
const userName = '홍길동';
const items = [];

// 변경이 필요한 경우
let counter = 0;
counter += 1;

// ❌ 잘못된 예시
var userName = '홍길동';  // var 사용 금지
let items = [];           // 변경이 없는데 let 사용
```

---

### 5.3 주석 규칙

**규칙**: 
- 복잡한 로직에만 주석 추가
- 코드 자체가 설명이 되도록 작성
- JSDoc 주석: 공개 API에만 사용

**예시**:
```typescript
// ✅ 올바른 예시
/**
 * 클라이언트 데이터를 검증합니다.
 * @param client - 검증할 클라이언트 데이터
 * @returns 검증된 클라이언트 데이터 또는 에러
 */
function validateClient(client: Client): ValidationResult {
  // 복잡한 검증 로직
  if (client.age < 0) {
    return { valid: false, error: '나이는 0 이상이어야 합니다.' };
  }
  return { valid: true, data: client };
}

// ✅ 간단한 코드는 주석 불필요
function add(a: number, b: number): number {
  return a + b;
}

// ❌ 잘못된 예시 (과도한 주석)
// 변수 a에 1을 할당
const a = 1;
// 변수 b에 2를 할당
const b = 2;
// a와 b를 더함
const sum = a + b;
```

---

## 6. React 컴포넌트 규칙

### 6.1 컴포넌트 구조

**규칙**: 다음 순서로 구성
1. Import 문
2. 타입 정의
3. 컴포넌트 정의
4. Export

**예시**:
```typescript
// ✅ 올바른 예시
import { useState } from 'react';
import { Client } from '@/types/client-types';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Client) => void;
}

export const ClientForm = ({ client, onSubmit }: ClientFormProps) => {
  const [name, setName] = useState('');
  
  const handleSubmit = () => {
    onSubmit({ name });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
};
```

---

### 6.2 Hooks 사용 규칙

**규칙**: 
- Hooks는 컴포넌트 최상단에서만 호출
- 조건문이나 반복문 내부에서 호출 금지

**예시**:
```typescript
// ✅ 올바른 예시
const ClientForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    // ...
  }, []);
  
  // ...
};

// ❌ 잘못된 예시
const ClientForm = () => {
  if (condition) {
    const [name, setName] = useState('');  // 조건문 내부에서 Hook 호출 금지
  }
};
```

---

## 7. 에러 처리 규칙

### 7.1 에러 처리 패턴

**규칙**: 명시적 에러 처리, `try-catch` 사용

**예시**:
```typescript
// ✅ 올바른 예시
async function fetchClient(id: string): Promise<Client> {
  try {
    const response = await fetch(`/api/clients/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch client: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
}

// ❌ 잘못된 예시
async function fetchClient(id: string) {
  const response = await fetch(`/api/clients/${id}`);  // 에러 처리 없음
  return await response.json();
}
```

---

## 8. 참고 자료

- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [React 공식 문서](https://react.dev/)
- [ESLint 규칙](https://eslint.org/docs/rules/)
- [Prettier 설정](./prettier-config.md)

---

## 9. 규칙 위반 시 대응

### 8.1 자동 검사

- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅 자동 적용
- **Pre-commit hook**: 커밋 전 자동 검사

### 8.2 수동 검사

- 코드 리뷰 시 코딩 표준 준수 여부 확인
- CI/CD 파이프라인에서 자동 검사

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

