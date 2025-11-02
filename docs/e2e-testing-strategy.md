# AT-CMP E2E 테스트 전략

**프로젝트 코드**: ATCMP-2026  
**작성일**: 2025-11-01  
**버전**: 1.0

---

## 📋 개요

AT-CMP 프로젝트의 E2E (End-to-End) 테스트 전략 문서입니다. 이 문서는 E2E 테스트의 범위, 우선순위, 환경 설정, CI/CD 통합 방법을 정의합니다.

---

## 1. E2E 테스트 도구 선택

### 1.1 도구 비교

| 도구 | 장점 | 단점 | 선택 여부 |
|------|------|------|----------|
| **Playwright** | • 빠른 실행 속도<br>• 다양한 브라우저 지원<br>• 강력한 디버깅 도구<br>• TypeScript 네이티브 지원 | • 학습 곡선 | ✅ **선택** |
| Cypress | • 사용하기 쉬움<br>• 좋은 문서화 | • 느린 실행 속도<br>• 브라우저 제한 | ❌ |

### 1.2 선택 근거

**Playwright 선택 이유**:
- TypeScript 네이티브 지원으로 프로젝트와 일관성 유지
- 빠른 실행 속도로 CI/CD에 적합
- 다양한 브라우저 지원 (Chrome, Firefox, Safari)
- 강력한 자동 대기 기능으로 안정적인 테스트

---

## 2. E2E 테스트 범위 정의

### 2.1 테스트 대상

**포함되는 시나리오**:
- ✅ 핵심 사용자 플로우 (Critical User Journeys)
- ✅ 주요 기능 통합 테스트
- ✅ 인증/인가 플로우
- ✅ 폼 제출 및 검증

**제외되는 시나리오**:
- ❌ 단위 테스트로 충분한 로직
- ❌ 순수 UI 컴포넌트 렌더링 (React Testing Library 사용)
- ❌ 성능 테스트 (별도 도구 사용)

### 2.2 핵심 시나리오 목록

#### 2.2.1 인증 플로우
- 사용자 로그인
- 사용자 로그아웃
- 비인증 사용자 접근 차단

#### 2.2.2 CMS 모듈 (사례관리)
- 대상자 등록 플로우
- 대상자 검색 및 필터
- 상담 기록 작성 및 수정
- 평가 기록 작성 및 수정

#### 2.2.3 ERM 모듈 (대여 기기 관리)
- 기기 등록 플로우
- 대여 신청 프로세스
- 반납 처리 프로세스
- 유지보수 노트 작성

### 2.3 테스트 우선순위

**P0 (최우선)**:
- 사용자 인증 플로우
- 대상자 등록 플로우
- 대여 신청 프로세스

**P1 (높음)**:
- 대상자 검색 및 필터
- 상담 기록 작성
- 반납 처리 프로세스

**P2 (중)**:
- 평가 기록 작성
- 유지보수 노트 작성
- 기기 상태 변경

**P3 (낮음)**:
- UI 상호작용 테스트
- 접근성 테스트

---

## 3. 테스트 환경 설정

### 3.1 설치

```bash
# Playwright 설치
pnpm add -D @playwright/test

# 브라우저 설치
pnpm exec playwright install
```

### 3.2 설정 파일

**`playwright.config.ts`**:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3.3 테스트 데이터 관리

**테스트 데이터 격리**:
- 각 테스트는 독립적인 데이터를 사용
- 테스트 전/후 데이터 정리 (`beforeEach`/`afterEach`)
- 테스트용 데이터베이스 분리 (staging 환경)

**예시**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('대상자 등록', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 전 로그인
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.afterEach(async ({ page }) => {
    // 테스트 후 정리 (필요시)
  });

  test('대상자를 등록할 수 있어야 함', async ({ page }) => {
    await page.goto('/clients/new');
    await page.fill('[name="name"]', '테스트 대상자');
    await page.fill('[name="contact_phone"]', '010-1234-5678');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=테스트 대상자')).toBeVisible();
  });
});
```

---

## 4. 테스트 시나리오 작성

### 4.1 테스트 구조

**디렉토리 구조**:

```
e2e/
├── auth/
│   ├── sign-in.spec.ts
│   └── sign-out.spec.ts
├── cms/
│   ├── client-registration.spec.ts
│   ├── client-search.spec.ts
│   └── consultation.spec.ts
├── erm/
│   ├── equipment-registration.spec.ts
│   ├── rental.spec.ts
│   └── return.spec.ts
└── utils/
    ├── auth-helpers.ts
    └── test-data.ts
```

### 4.2 테스트 예시

**인증 플로우** (`e2e/auth/sign-in.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test.describe('로그인', () => {
  test('유효한 자격증명으로 로그인할 수 있어야 함', async ({ page }) => {
    await page.goto('/sign-in');
    
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=대시보드')).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인할 수 없어야 함', async ({ page }) => {
    await page.goto('/sign-in');
    
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=로그인에 실패했습니다')).toBeVisible();
  });
});
```

**대상자 등록 플로우** (`e2e/cms/client-registration.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../utils/auth-helpers';

test.describe('대상자 등록', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'password123');
  });

  test('대상자를 등록할 수 있어야 함', async ({ page }) => {
    await page.goto('/clients/new');
    
    // 필수 필드 입력
    await page.fill('[name="name"]', '홍길동');
    await page.fill('[name="birth_date"]', '1990-01-01');
    await page.selectOption('[name="gender"]', 'male');
    await page.fill('[name="contact_phone"]', '010-1234-5678');
    
    // 제출
    await page.click('button[type="submit"]');
    
    // 성공 확인
    await expect(page.locator('text=홍길동')).toBeVisible();
    await expect(page).toHaveURL(/\/clients\/\w+/);
  });

  test('필수 필드 없이 등록할 수 없어야 함', async ({ page }) => {
    await page.goto('/clients/new');
    
    // 이름 없이 제출
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('text=이름을 입력해주세요')).toBeVisible();
  });
});
```

---

## 5. CI/CD 통합

### 5.1 GitHub Actions 워크플로우

**`.github/workflows/e2e.yml`**:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # 매일 새벽 2시 실행

jobs:
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.19.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Setup test database
        run: |
          # 테스트 데이터베이스 설정 (필요시)
          echo "Setup test database"

      - name: Build application
        run: pnpm --filter web build
        env:
          SKIP_ENV_VALIDATION: true

      - name: Run E2E tests
        run: pnpm --filter web test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000
          TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### 5.2 테스트 실행 스크립트

**`package.json`에 추가**:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 5.3 CI/CD 통합 전략

**테스트 실행 타이밍**:
- **PR 생성 시**: P0 시나리오만 실행 (빠른 피드백)
- **develop 브랜치 머지 시**: 전체 E2E 테스트 실행
- **스케줄 실행**: 매일 새벽 2시 전체 테스트 실행 (회귀 테스트)

**병렬 실행**:
- 프로젝트별로 병렬 실행 가능
- 브라우저별로 병렬 실행 가능 (chromium, firefox, webkit)

---

## 6. 테스트 유지보수

### 6.1 테스트 안정성

**best practices**:
- 자동 대기 사용 (`waitFor`, `waitForURL`)
- 명확한 셀렉터 사용 (data-testid 권장)
- 테스트 격리 (각 테스트 독립적)
- 재시도 로직 설정 (CI 환경에서 2회 재시도)

**예시**:

```typescript
// ✅ 좋은 예시
await page.locator('[data-testid="client-name"]').fill('홍길동');
await page.waitForURL(/\/clients\/\w+/);

// ❌ 나쁜 예시
await page.locator('div > div > div > input').fill('홍길동');
await page.waitForTimeout(1000);  // 고정 대기 시간 사용 금지
```

### 6.2 테스트 데이터 관리

**테스트 헬퍼 함수**:

```typescript
// e2e/utils/auth-helpers.ts
export async function login(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

// e2e/utils/test-data.ts
export const testClients = {
  valid: {
    name: '홍길동',
    birth_date: '1990-01-01',
    gender: 'male',
    contact_phone: '010-1234-5678',
  },
  invalid: {
    name: '',
    birth_date: '2099-01-01',  // 미래 날짜
  },
};
```

### 6.3 디버깅

**Playwright 디버깅 도구**:
- `playwright test --debug`: 디버그 모드 실행
- `playwright test --ui`: UI 모드 실행
- `playwright show-trace`: 트레이스 파일 재생

---

## 7. 성과 측정

### 7.1 테스트 메트릭

**추적 지표**:
- 테스트 실행 시간
- 테스트 통과율
- 테스트 커버리지 (시나리오 기준)
- 버그 발견율

### 7.2 목표

- **테스트 실행 시간**: 10분 이내 (CI 환경)
- **테스트 통과율**: 95% 이상
- **핵심 시나리오 커버리지**: 100%

---

## 8. 다음 단계

### 8.1 단기 계획 (1-2주)

- [ ] Playwright 설치 및 설정
- [ ] P0 시나리오 E2E 테스트 작성
- [ ] CI/CD 통합

### 8.2 중기 계획 (1-2개월)

- [ ] P1 시나리오 E2E 테스트 작성
- [ ] 테스트 데이터 관리 체계 구축
- [ ] 테스트 리포트 자동화

### 8.3 장기 계획 (3개월 이상)

- [ ] P2/P3 시나리오 E2E 테스트 작성
- [ ] 성능 테스트 통합
- [ ] 시각적 회귀 테스트 추가

---

## 9. 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [E2E 테스트 모범 사례](https://playwright.dev/docs/best-practices)
- [프로젝트 테스트 가이드](./testing-guide.md)

---

**마지막 업데이트**: 2025-11-01  
**다음 검토일**: 2026-02-01

