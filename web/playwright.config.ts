import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 설정 파일
 *
 * E2E 테스트 환경 설정을 정의합니다.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: "./e2e",

  // 완전 병렬 실행
  fullyParallel: true,

  // CI 환경에서는 forbidOnly 활성화 (테스트 스킵 방지)
  forbidOnly: !!process.env.CI,

  // 재시도 설정 (CI 환경에서만)
  retries: process.env.CI ? 2 : 0,

  // 워커 수 설정 (CI 환경에서는 1개로 제한)
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: process.env.CI ? [["html"], ["github"]] : "html",

  // 공통 설정
  use: {
    // 기본 URL
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",

    // 첫 번째 재시도에서만 트레이스 수집
    trace: "on-first-retry",

    // 스크린샷 설정
    screenshot: "only-on-failure",

    // 비디오 설정
    video: "retain-on-failure",
  },

  // 브라우저 프로젝트 설정
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // CI 환경에서는 Chrome만 실행 (빠른 피드백을 위해)
    ...(process.env.CI
      ? []
      : [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },
        ]),
  ],

  // 웹 서버 설정
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  },

  // 타임아웃 설정
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
});
