# AT-CMP 테스트 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 테스트 작성 가이드입니다. 이 가이드는 단위 테스트, 통합 테스트 작성을 위한 표준과 모범 사례를 제공합니다.

---

## 1. 테스트 환경 설정

### 1.1 Jest 설정

프로젝트는 Jest를 테스트 프레임워크로 사용합니다.

**설정 파일**:
- `web/jest.config.js`: Jest 설정
- `web/jest.setup.js`: 테스트 환경 설정

**주요 설정**:
- 테스트 커버리지 목표: **70% 이상**
- 테스트 환경: `jest-environment-jsdom` (React 컴포넌트 테스트용)
- 모듈 경로 매핑: `@/` → `src/`

### 1.2 테스트 실행

```bash
# 개발 모드 (watch 모드)
pnpm test

# CI 모드 (커버리지 포함)
pnpm test:ci
```

---

## 2. 단위 테스트 (Unit Tests)

### 2.1 테스트 파일 명명 규칙

**규칙**: `*.test.ts` 또는 `*.spec.ts` 사용

**예시**:
```
src/lib/validations/client.test.ts
src/lib/utils/debounce.test.ts
src/components/clients/ClientForm.test.tsx
```

### 2.2 테스트 구조 (AAA 패턴)

모든 테스트는 **AAA 패턴** (Arrange-Act-Assert)을 따라야 합니다.

**구조**:
1. **Arrange**: 테스트 데이터 준비
2. **Act**: 테스트할 함수/메서드 실행
3. **Assert**: 결과 검증

**예시**:

```typescript
import { clientSchema } from "../client";

describe("clientSchema", () => {
  describe("필수 필드 검증", () => {
    it("이름이 없으면 실패해야 함", () => {
      // Arrange: 테스트 데이터 준비
      const invalidData = {};
      
      // Act: 함수 실행
      const result = clientSchema.safeParse(invalidData);
      
      // Assert: 결과 검증
      expect(result.success).toBe(false);
    });
  });
});
```

### 2.3 유효성 검증 테스트 작성

**Zod 스키마 테스트 예시**:

```typescript
import { clientSchema } from "../client";

describe("clientSchema", () => {
  describe("이름 검증", () => {
    it("이름이 2자 미만이면 실패해야 함", () => {
      const result = clientSchema.safeParse({ name: "a" });
      expect(result.success).toBe(false);
    });

    it("이름이 100자를 초과하면 실패해야 함", () => {
      const result = clientSchema.safeParse({ name: "a".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("유효한 이름이면 성공해야 함", () => {
      const result = clientSchema.safeParse({ name: "홍길동" });
      expect(result.success).toBe(true);
    });
  });

  describe("전화번호 검증", () => {
    it("유효한 전화번호 형식이면 성공해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_phone: "010-1234-5678",
      });
      expect(result.success).toBe(true);
    });

    it("잘못된 전화번호 형식이면 실패해야 함", () => {
      const result = clientSchema.safeParse({
        name: "홍길동",
        contact_phone: "123-456",
      });
      expect(result.success).toBe(false);
    });
  });
});
```

### 2.4 유틸리티 함수 테스트 작성

**예시**:

```typescript
import { debounce } from "../debounce";

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("지정된 시간 후에 함수를 실행해야 함", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("연속 호출 시 마지막 호출만 실행해야 함", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

### 2.5 Mock 사용법

**외부 라이브러리 Mock**:

```typescript
// Clerk 모킹
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

// Supabase 모킹
jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: jest.fn(),
}));

// auditLogger 모킹
jest.mock("@/lib/logger/auditLogger", () => ({
  auditLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
```

**Mock 함수 사용**:

```typescript
import { auth } from "@clerk/nextjs/server";

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("인증 검증", () => {
  it("로그인하지 않은 경우 401 반환해야 함", async () => {
    // Arrange: Mock 설정
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });

    // Act: 함수 실행
    const response = await POST(request);

    // Assert: 결과 검증
    expect(response.status).toBe(401);
  });
});
```

### 2.6 좋은 테스트 예시

**✅ 좋은 테스트**:

```typescript
describe("clientSchema", () => {
  describe("필수 필드 검증", () => {
    it("이름이 없으면 실패해야 함", () => {
      const result = clientSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("이름이 2자 미만이면 실패해야 함", () => {
      const result = clientSchema.safeParse({ name: "a" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });
  });
});
```

**특징**:
- 명확한 테스트 이름
- 단일 책임 (하나의 시나리오만 테스트)
- 명확한 검증 로직
- 에러 메시지까지 검증

### 2.7 나쁜 테스트 예시

**❌ 나쁜 테스트**:

```typescript
describe("clientSchema", () => {
  it("검증 테스트", () => {
    // 너무 많은 시나리오를 한 테스트에서 검증
    const result1 = clientSchema.safeParse({});
    const result2 = clientSchema.safeParse({ name: "a" });
    const result3 = clientSchema.safeParse({ name: "홍길동" });
    
    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
    expect(result3.success).toBe(true);
  });
});
```

**문제점**:
- 테스트 이름이 모호함
- 여러 시나리오를 한 테스트에서 검증
- 실패 시 어떤 시나리오가 실패했는지 파악 어려움

---

## 3. 통합 테스트 (Integration Tests)

### 3.1 통합 테스트란?

통합 테스트는 여러 컴포넌트가 함께 작동하는 방식을 검증합니다. 예를 들어:
- API Route와 데이터베이스
- API Route와 인증 시스템
- 여러 함수가 함께 작동하는 시나리오

### 3.2 API Route 통합 테스트 작성

**예시**:

```typescript
import { POST } from "../route";

// 외부 의존성 모킹
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: jest.fn(),
}));

jest.mock("@/lib/logger/auditLogger", () => ({
  auditLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("POST /api/clients", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("인증 검증", () => {
    it("로그인하지 않은 경우 401 반환해야 함", async () => {
      mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("역할 권한 검증", () => {
    it("technician 역할은 403 반환해야 함", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "technician" } },
      });

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  describe("데이터 검증", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: "user_123",
        sessionClaims: { metadata: { role: "admin" } },
      });
    });

    it("이름이 없으면 400 반환해야 함", async () => {
      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("유효한 데이터이면 성공해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "client_123", name: "홍길동" },
                error: null,
              }),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("client_123");
    });
  });

  describe("데이터베이스 오류 처리", () => {
    it("Supabase insert 실패 시 500 반환해야 함", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      };

      mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);

      const request = new Request("http://localhost/api/clients", {
        method: "POST",
        body: JSON.stringify({ name: "홍길동" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
```

### 3.3 테스트 격리 방법

**중요**: 각 테스트는 독립적으로 실행되어야 합니다.

**best practices**:

```typescript
describe("POST /api/clients", () => {
  beforeEach(() => {
    // 각 테스트 전에 Mock 초기화
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 각 테스트 후 정리 작업 (필요시)
  });

  it("테스트 1", async () => {
    // 독립적인 테스트
  });

  it("테스트 2", async () => {
    // 독립적인 테스트 (테스트 1의 영향을 받지 않음)
  });
});
```

### 3.4 데이터베이스 테스트 작성

**주의**: 실제 데이터베이스를 사용하지 않고 Mock을 사용합니다.

**Mock 패턴**:

```typescript
const mockSupabase = {
  from: jest.fn().mockReturnValue({
    // Select 쿼리 Mock
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: "client_123", name: "홍길동" },
          error: null,
        }),
      }),
    }),
    
    // Insert 쿼리 Mock
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: "client_123", name: "홍길동" },
          error: null,
        }),
      }),
    }),
    
    // Update 쿼리 Mock
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "client_123", name: "새이름" },
            error: null,
          }),
        }),
      }),
    }),
  }),
};

mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any);
```

---

## 4. 테스트 커버리지

### 4.1 커버리지 목표

**목표**: **70% 이상**

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

### 4.2 커버리지 확인

```bash
# CI 모드에서 커버리지 리포트 생성
pnpm test:ci

# 커버리지 리포트는 coverage/ 폴더에 생성됩니다
```

### 4.3 커버리지 개선 가이드

**낮은 커버리지 영역**:
1. 에러 처리 경로 테스트 추가
2. 경계 값 테스트 추가
3. 예외 케이스 테스트 추가

---

## 5. 테스트 작성 체크리스트

테스트 작성 시 다음 항목을 확인하세요:

- [ ] 테스트 이름이 명확한가?
- [ ] AAA 패턴을 따르는가?
- [ ] 각 테스트가 독립적인가?
- [ ] Mock을 적절히 사용하는가?
- [ ] 에러 케이스를 테스트하는가?
- [ ] 경계 값을 테스트하는가?
- [ ] 테스트 커버리지가 70% 이상인가?

---

## 6. 참고 자료

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Testing Library 공식 문서](https://testing-library.com/)
- [프로젝트 코딩 표준](./coding-standards.md)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

