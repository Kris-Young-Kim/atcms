# JSDoc 주석 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 JSDoc 주석 작성 가이드입니다. 이 가이드는 코드의 가독성과 유지보수성을 높이기 위해 표준화된 주석 작성 방법을 정의합니다.

---

## 📝 JSDoc 기본 형식

### 기본 구조

```typescript
/**
 * 함수/컴포넌트의 간단한 설명
 * 
 * @param {Type} paramName - 파라미터 설명
 * @returns {Type} 반환값 설명
 * @throws {ErrorType} 에러 설명
 * @example
 * // 사용 예시
 * exampleFunction(value);
 */
```

---

## 🎯 작성 규칙

### 1. 함수/메서드

**필수 항목:**
- 함수 설명
- `@param` (모든 파라미터)
- `@returns` (반환값이 있는 경우)

**예시:**

```typescript
/**
 * 대상자 정보를 검증하고 Supabase에 저장합니다.
 * 
 * @param {ClientFormData} data - 대상자 등록 폼 데이터
 * @param {string} userId - 현재 사용자 ID (Clerk User ID)
 * @returns {Promise<Client>} 생성된 대상자 객체
 * @throws {ValidationError} 입력 데이터 검증 실패 시
 * @throws {DatabaseError} 데이터베이스 저장 실패 시
 * 
 * @example
 * ```typescript
 * const client = await createClient(formData, userId);
 * console.log(client.id);
 * ```
 */
export async function createClient(
  data: ClientFormData,
  userId: string,
): Promise<Client> {
  // ...
}
```

### 2. React 컴포넌트

**필수 항목:**
- 컴포넌트 설명
- Props 인터페이스에 각 prop의 설명
- 사용 예시 (복잡한 컴포넌트)

**예시:**

```typescript
/**
 * 상담 기록 등록/수정 폼 컴포넌트
 * 
 * SOAP 형식의 상담 기록을 작성하고 저장할 수 있습니다.
 * 파일 첨부 기능을 지원합니다.
 * 
 * @component
 * 
 * @example
 * ```tsx
 * <ConsultationForm
 *   clientId="uuid"
 *   mode="create"
 *   onCreateSuccess={() => console.log('Success')}
 * />
 * ```
 */

interface ConsultationFormProps {
  /** 대상자 ID */
  readonly clientId: string;
  
  /** 
   * 초기 데이터 (수정 모드에서 사용)
   * @default undefined
   */
  readonly initialData?: ConsultationFormData;
  
  /** 
   * 상담 기록 ID (수정 모드에서 사용)
   * @default undefined
   */
  readonly consultationId?: string;
  
  /** 
   * 폼 모드
   * @default "create"
   */
  readonly mode?: "create" | "edit";
  
  /** 성공 시 콜백 함수 */
  readonly onSuccess?: () => void;
}

export function ConsultationForm({
  clientId,
  initialData,
  consultationId,
  mode = "create",
  onSuccess,
}: ConsultationFormProps) {
  // ...
}
```

### 3. API Route Handlers

**필수 항목:**
- HTTP 메서드 및 경로
- 기능 설명
- 권한 요구사항
- 요청/응답 형식 설명

**예시:**

```typescript
/**
 * POST /api/clients
 * 
 * 새 대상자 등록
 * 
 * **권한**: `admin`, `leader`, `specialist`만 가능
 * 
 * **요청 본문:**
 * ```json
 * {
 *   "name": "홍길동",
 *   "contact_phone": "010-1234-5678",
 *   ...
 * }
 * ```
 * 
 * **응답:**
 * - `201 Created`: 성공 시 생성된 대상자 객체 반환
 * - `400 Bad Request`: 입력 검증 실패
 * - `401 Unauthorized`: 인증 실패
 * - `403 Forbidden`: 권한 없음
 * - `500 Internal Server Error`: 서버 오류
 * 
 * @see {@link https://github.com/Kris-Young-Kim/atcmp/blob/main/API_DOCS.md#post-apiclients API 문서}
 */
export async function POST(request: Request) {
  // ...
}
```

### 4. 유틸리티 함수

**필수 항목:**
- 함수 설명
- 파라미터 설명
- 반환값 설명
- 사용 예시 (복잡한 함수)

**예시:**

```typescript
/**
 * 함수 실행을 지연시킵니다 (Debounce).
 * 
 * 지정된 시간 동안 연속된 호출을 무시하고, 마지막 호출 후에만 함수를 실행합니다.
 * 검색 입력 등에서 유용합니다.
 * 
 * @template T - 원본 함수 타입
 * @param {T} callback - 실행할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {(...args: Parameters<T>) => void} 지연된 함수
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Search:', query);
 * }, 300);
 * 
 * debouncedSearch('a'); // 무시됨
 * debouncedSearch('ab'); // 무시됨
 * debouncedSearch('abc'); // 300ms 후 실행됨
 * ```
 */
export function debounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  // ...
}
```

### 5. TypeScript 타입/인터페이스

**필수 항목:**
- 타입 설명
- 각 속성 설명

**예시:**

```typescript
/**
 * 대상자 등록 폼 데이터 타입
 * 
 * @see {@link clientSchema} Zod 검증 스키마
 */
export interface ClientFormData {
  /** 대상자 이름 (필수) */
  name: string;
  
  /** 
   * 생년월일
   * @format YYYY-MM-DD
   */
  birth_date?: string;
  
  /** 성별 */
  gender?: "male" | "female" | "other";
  
  /** 연락처 (전화번호) */
  contact_phone?: string;
  
  /** 연락처 (이메일) */
  contact_email?: string;
  
  /** 
   * 대상자 상태
   * @default "active"
   */
  status?: "active" | "inactive" | "discharged";
}
```

### 6. 클래스

**필수 항목:**
- 클래스 설명
- 생성자 설명
- 주요 메서드 설명

**예시:**

```typescript
/**
 * Supabase 클라이언트 래퍼 클래스
 * 
 * 서버 사이드에서 Supabase 클라이언트를 생성하고 관리합니다.
 * 쿠키 기반 인증을 처리합니다.
 */
export class SupabaseServerClient {
  /**
   * Supabase 서버 클라이언트 생성
   * 
   * @param {string} url - Supabase 프로젝트 URL
   * @param {string} anonKey - Supabase Anon Key
   */
  constructor(url: string, anonKey: string) {
    // ...
  }
  
  /**
   * 데이터베이스 쿼리 실행
   * 
   * @param {string} table - 테이블 이름
   * @returns {QueryBuilder} 쿼리 빌더
   */
  from(table: string): QueryBuilder {
    // ...
  }
}
```

---

## 🏷️ JSDoc 태그 참고

### 일반 태그

| 태그 | 설명 | 예시 |
|------|------|------|
| `@param` | 함수 파라미터 설명 | `@param {string} name - 이름` |
| `@returns` | 반환값 설명 | `@returns {Promise<Client>} 대상자 객체` |
| `@throws` | 발생 가능한 에러 | `@throws {ValidationError} 검증 실패 시` |
| `@example` | 사용 예시 | `@example \`\`\`ts\ncode\n\`\`\`` |
| `@see` | 참고 문서 | `@see {@link API_DOCS.md}` |
| `@deprecated` | 사용 중단 표시 | `@deprecated Use newFunction instead` |
| `@since` | 추가된 버전 | `@since 1.0.0` |
| `@author` | 작성자 | `@author 개발팀` |

### TypeScript 특화 태그

| 태그 | 설명 | 예시 |
|------|------|------|
| `@template` | 제네릭 타입 설명 | `@template T - 함수 타입` |
| `@type` | 타입 설명 | `@type {string \| number}` |
| `@typedef` | 타입 정의 | `@typedef {Object} Config` |

### React 컴포넌트 태그

| 태그 | 설명 | 예시 |
|------|------|------|
| `@component` | 컴포넌트임을 명시 | `@component` |
| `@default` | 기본값 | `@default "create"` |

---

## ✍️ 작성 모범 사례

### 1. 간결하고 명확하게

**좋은 예:**

```typescript
/**
 * 대상자 목록을 검색합니다.
 * 
 * @param {string} query - 검색어 (이름 또는 연락처)
 * @returns {Promise<Client[]>} 검색 결과 배열
 */
```

**나쁜 예:**

```typescript
/**
 * 이 함수는 대상자 목록을 검색하는 함수입니다.
 * 쿼리 파라미터를 받아서 검색을 수행하고 결과를 반환합니다.
 */
```

### 2. 타입 정보는 TypeScript가 제공

**좋은 예:**

```typescript
/**
 * 대상자 정보를 검증합니다.
 * 
 * @param data - 검증할 대상자 데이터
 * @returns 검증 결과 객체
 */
function validateClient(data: ClientFormData): ValidationResult {
  // ...
}
```

**나쁜 예:**

```typescript
/**
 * @param {ClientFormData} data - 검증할 대상자 데이터
 * @returns {ValidationResult} 검증 결과 객체
 */
```

### 3. 복잡한 로직은 상세히 설명

```typescript
/**
 * 대여 시 기기 가용 수량을 자동으로 감소시킵니다.
 * 
 * 트리거를 통해 자동으로 실행되며, 다음 로직을 수행합니다:
 * 1. 대여 상태가 'active'인지 확인
 * 2. 기기의 현재 가용 수량 확인
 * 3. 대여 수량만큼 가용 수량 감소
 * 4. 가용 수량이 부족하면 예외 발생
 * 
 * @param {Rental} rental - 생성된 대여 기록
 * @throws {Error} 가용 수량 부족 시
 */
```

### 4. 비즈니스 규칙 설명

```typescript
/**
 * 기기 상태를 변경합니다.
 * 
 * **상태 전이 규칙:**
 * - `normal` → `maintenance`: 유지보수 시작
 * - `maintenance` → `normal`: 유지보수 완료
 * - `maintenance` → `retired`: 기기 폐기
 * - `normal` → `retired`: 기기 폐기
 * - `retired` → 다른 상태: **불가능** (폐기된 기기는 복구 불가)
 * 
 * @param {string} equipmentId - 기기 ID
 * @param {EquipmentStatus} newStatus - 새로운 상태
 * @throws {Error} 잘못된 상태 전이 시도 시
 */
```

### 5. 사용 예시 제공

```typescript
/**
 * SOAP 템플릿을 생성합니다.
 * 
 * @returns {SOAPTemplate} 빈 SOAP 템플릿 객체
 * 
 * @example
 * ```typescript
 * const template = createSOAPTemplate();
 * template.subjective = "환자가 호소하는 증상";
 * template.objective = "관찰된 객관적 정보";
 * template.assessment = "평가 내용";
 * template.plan = "치료 계획";
 * ```
 */
```

---

## 📋 체크리스트

다음 항목을 확인하세요:

### 함수/메서드
- [ ] 함수 설명이 명확한가?
- [ ] 모든 파라미터에 `@param`이 있는가?
- [ ] 반환값에 `@returns`가 있는가?
- [ ] 발생 가능한 에러에 `@throws`가 있는가?
- [ ] 복잡한 함수는 `@example`이 있는가?

### 컴포넌트
- [ ] 컴포넌트 설명이 명확한가?
- [ ] Props 인터페이스에 각 prop 설명이 있는가?
- [ ] 복잡한 컴포넌트는 `@example`이 있는가?

### API Route
- [ ] HTTP 메서드와 경로가 명시되어 있는가?
- [ ] 권한 요구사항이 명시되어 있는가?
- [ ] 요청/응답 형식이 설명되어 있는가?

### 타입/인터페이스
- [ ] 타입 설명이 명확한가?
- [ ] 각 속성에 설명이 있는가?
- [ ] 기본값이 있으면 `@default`가 있는가?

---

## 🔗 관련 문서

- [API 문서](./API_DOCS.md)
- [개발 가이드](./DEVELOPMENT.md)
- [시스템 아키텍처](./ARCHITECTURE.md)

---

## 📚 참고 자료

- [JSDoc 공식 문서](https://jsdoc.app/)
- [TypeScript JSDoc 가이드](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TSDoc 표준](https://tsdoc.org/)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

