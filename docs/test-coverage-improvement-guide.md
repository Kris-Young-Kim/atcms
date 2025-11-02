# 테스트 커버리지 개선 가이드

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-01-27  
**버전**: 1.0

---

## 📋 개요

이 문서는 테스트 커버리지를 70% 이상 달성하기 위한 가이드입니다. 현재 커버리지 상태를 분석하고, 개선 전략을 수립합니다.

---

## 🎯 목표

- **전체 테스트 커버리지 70% 이상 달성**
- **Statements**: 70% 이상
- **Branches**: 70% 이상
- **Functions**: 70% 이상
- **Lines**: 70% 이상

---

## 📊 현재 커버리지 상태

### 완료된 테스트

#### 단위 테스트
- ✅ `web/src/lib/validations/__tests__/client.test.ts` - 클라이언트 검증 스키마 테스트

#### API 통합 테스트
- ✅ `web/src/app/api/clients/__tests__/route.test.ts` - POST /api/clients
- ✅ `web/src/app/api/clients/[id]/__tests__/route.test.ts` - GET, PUT /api/clients/[id]
- ✅ `web/src/app/api/equipment/__tests__/route.test.ts` - GET, POST /api/equipment
- ✅ `web/src/app/api/rentals/__tests__/route.test.ts` - POST /api/rentals

### 테스트 필요 영역

#### API Routes (우선순위 높음)
- [ ] GET /api/clients (목록 조회)
- [ ] GET /api/clients/[id]/consultations (상담 기록 목록)
- [ ] POST /api/clients/[id]/consultations (상담 기록 생성)
- [ ] GET /api/clients/[id]/consultations/[consultationId] (상담 기록 상세)
- [ ] PUT /api/clients/[id]/consultations/[consultationId] (상담 기록 수정)
- [ ] GET /api/clients/[id]/assessments (평가 기록 목록)
- [ ] POST /api/clients/[id]/assessments (평가 기록 생성)
- [ ] GET /api/clients/[id]/assessments/[assessmentId] (평가 기록 상세)
- [ ] PUT /api/clients/[id]/assessments/[assessmentId] (평가 기록 수정)
- [ ] GET /api/equipment/[id] (기기 상세 조회)
- [ ] PUT /api/equipment/[id] (기기 정보 수정)
- [ ] POST /api/equipment/[id]/maintenance-notes (유지보수 노트 작성)
- [ ] GET /api/equipment/[id]/maintenance-notes (유지보수 노트 목록)
- [ ] GET /api/rentals (대여 기록 목록)
- [ ] POST /api/rentals/[id]/return (반납 처리)
- [ ] GET /api/dashboard/stats (대시보드 통계)

#### 유틸리티 함수
- [ ] `web/src/lib/utils/debounce.ts` - Debounce 함수
- [ ] `web/src/lib/utils/soap-template.ts` - SOAP 템플릿 관리
- [ ] `web/src/lib/utils/rental-contract.ts` - 대여 계약서 생성

#### 컴포넌트 테스트 (우선순위 중간)
- [ ] `web/src/components/auth/ProtectedRoute.tsx` - 인증/권한 컴포넌트
- [ ] `web/src/components/clients/ClientForm.tsx` - 대상자 폼
- [ ] `web/src/components/clients/ClientsFilter.tsx` - 필터 컴포넌트
- [ ] `web/src/components/clients/ClientsTable.tsx` - 테이블 컴포넌트
- [ ] `web/src/components/ui/Toast.tsx` - 토스트 컴포넌트
- [ ] `web/src/components/ui/FileUpload.tsx` - 파일 업로드 컴포넌트

---

## 🔍 커버리지 분석 방법

### 1. 커버리지 리포트 생성

```bash
cd web
pnpm test:ci
```

커버리지 리포트는 `web/coverage/` 디렉토리에 생성됩니다.

### 2. 커버리지 리포트 확인

#### HTML 리포트 확인
```bash
# macOS/Linux
open web/coverage/lcov-report/index.html

# Windows
start web/coverage/lcov-report/index.html
```

#### 터미널에서 확인
```bash
cd web
pnpm test:ci
```

터미널에서 각 파일의 커버리지 퍼센트를 확인할 수 있습니다.

### 3. 커버리지가 낮은 영역 식별

다음 기준으로 우선순위를 설정합니다:

1. **핵심 비즈니스 로직** (우선순위: 높음)
   - API Route 핵심 함수
   - 유틸리티 함수
   - 검증 스키마

2. **에러 처리 경로** (우선순위: 높음)
   - try-catch 블록
   - 에러 응답 처리
   - 데이터베이스 오류 처리

3. **경계 값 처리** (우선순위: 중간)
   - 최소/최대 값 검증
   - 빈 값 처리
   - null/undefined 처리

4. **UI 컴포넌트** (우선순위: 낮음)
   - 단순 렌더링 컴포넌트
   - 스타일링 컴포넌트

---

## 📝 커버리지 개선 전략

### 1. API Route 테스트 작성

#### 패턴 1: GET 요청 테스트
```typescript
describe("GET /api/resource", () => {
  it("인증되지 않은 경우 401 반환", async () => {
    // 인증 Mock 설정
    // 요청 실행
    // 응답 검증
  });

  it("성공적으로 데이터를 조회할 수 있어야 함", async () => {
    // 인증 Mock 설정
    // Supabase Mock 설정
    // 요청 실행
    // 응답 검증
  });
});
```

#### 패턴 2: POST 요청 테스트
```typescript
describe("POST /api/resource", () => {
  it("인증되지 않은 경우 401 반환", async () => {});
  it("권한이 없는 경우 403 반환", async () => {});
  it("잘못된 데이터로 요청 시 400 반환", async () => {});
  it("유효한 데이터로 생성할 수 있어야 함", async () => {});
  it("데이터베이스 오류 시 500 반환", async () => {});
});
```

### 2. 유틸리티 함수 테스트 작성

#### 패턴: 함수별 테스트
```typescript
describe("utilityFunction", () => {
  it("정상 케이스 처리", () => {
    // Arrange
    // Act
    // Assert
  });

  it("경계 값 처리", () => {
    // 최소값 테스트
    // 최대값 테스트
  });

  it("에러 케이스 처리", () => {
    // 잘못된 입력 테스트
  });
});
```

### 3. 컴포넌트 테스트 작성

#### 패턴: React Testing Library 사용
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { Component } from "./Component";

describe("Component", () => {
  it("렌더링되어야 함", () => {
    render(<Component />);
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("사용자 상호작용이 정상적으로 작동해야 함", () => {
    render(<Component />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

---

## 📈 커버리지 모니터링

### CI/CD 통합

현재 `.github/workflows/ci.yml`에 테스트 커버리지 검사가 포함되어 있습니다:

```yaml
- name: Run tests
  run: pnpm --filter web test:ci
  env:
    SKIP_ENV_VALIDATION: true
    NODE_ENV: test
```

### 커버리지 게이트

`web/jest.config.js`에 커버리지 임계값이 설정되어 있습니다:

```javascript
coverageThreshold: {
  global: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  },
}
```

### 커버리지 리포트 자동 생성

CI/CD에서 자동으로 커버리지 리포트가 생성됩니다:
- `web/coverage/lcov.info` - LCOV 형식 리포트
- `web/coverage/lcov-report/` - HTML 리포트

---

## ✅ 커버리지 개선 체크리스트

### API Routes
- [ ] 모든 GET 엔드포인트 테스트 작성
- [ ] 모든 POST 엔드포인트 테스트 작성
- [ ] 모든 PUT 엔드포인트 테스트 작성
- [ ] 모든 DELETE 엔드포인트 테스트 작성
- [ ] 인증/권한 검증 테스트 포함
- [ ] 입력 검증 테스트 포함
- [ ] 성공 케이스 테스트 포함
- [ ] 에러 케이스 테스트 포함
- [ ] 데이터베이스 오류 처리 테스트 포함

### 유틸리티 함수
- [ ] 모든 유틸리티 함수 테스트 작성
- [ ] 정상 케이스 테스트 포함
- [ ] 경계 값 테스트 포함
- [ ] 에러 케이스 테스트 포함

### 컴포넌트
- [ ] 핵심 컴포넌트 테스트 작성
- [ ] 렌더링 테스트 포함
- [ ] 사용자 상호작용 테스트 포함
- [ ] 에러 상태 테스트 포함

---

## 🎯 우선순위별 작업 계획

### Phase 1: API Routes 완료 (1-2주)
1. 남은 API 엔드포인트 테스트 작성
2. 모든 인증/권한 검증 테스트 추가
3. 모든 에러 케이스 테스트 추가

### Phase 2: 유틸리티 함수 테스트 (1주)
1. debounce 함수 테스트 작성
2. SOAP 템플릿 함수 테스트 작성
3. 대여 계약서 함수 테스트 작성

### Phase 3: 컴포넌트 테스트 (1-2주)
1. ProtectedRoute 컴포넌트 테스트 작성
2. ClientForm 컴포넌트 테스트 작성
3. Toast 컴포넌트 테스트 작성

---

## 📚 참고 자료

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Testing Library 공식 문서](https://testing-library.com/)
- [프로젝트 테스트 가이드](./testing-guide.md)
- [API 문서](./API_DOCS.md)

---

**마지막 업데이트**: 2025-01-27  
**다음 검토일**: 커버리지 70% 달성 시

