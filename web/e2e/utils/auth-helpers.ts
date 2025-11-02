/**
 * E2E 테스트 인증 헬퍼 함수
 *
 * 로그인/로그아웃 등 인증 관련 공통 함수를 제공합니다.
 */

import { Page } from "@playwright/test";

/**
 * 테스트용 사용자 계정
 */
export const testUsers = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || "admin@test.com",
    password: process.env.E2E_ADMIN_PASSWORD || "password123",
  },
  leader: {
    email: process.env.E2E_LEADER_EMAIL || "leader@test.com",
    password: process.env.E2E_LEADER_PASSWORD || "password123",
  },
  specialist: {
    email: process.env.E2E_SPECIALIST_EMAIL || "specialist@test.com",
    password: process.env.E2E_SPECIALIST_PASSWORD || "password123",
  },
};

/**
 * 로그인 헬퍼 함수
 *
 * @param page - Playwright Page 객체
 * @param email - 이메일 주소
 * @param password - 비밀번호
 *
 * @example
 * ```typescript
 * await login(page, testUsers.admin.email, testUsers.admin.password);
 * ```
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/sign-in");

  // Clerk SignIn 컴포넌트가 로드될 때까지 대기
  await page.waitForSelector('[name="identifier"]', { timeout: 10000 });

  // 이메일 입력
  await page.fill('[name="identifier"]', email);

  // 다음 버튼 클릭 (Clerk UI)
  await page.click('button:has-text("Continue")');

  // 비밀번호 입력 필드가 나타날 때까지 대기
  await page.waitForSelector('[name="password"]', { timeout: 5000 });

  // 비밀번호 입력
  await page.fill('[name="password"]', password);

  // 로그인 버튼 클릭
  await page.click('button:has-text("Continue")');

  // 대시보드로 리디렉션될 때까지 대기
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * 로그아웃 헬퍼 함수
 *
 * @param page - Playwright Page 객체
 *
 * @example
 * ```typescript
 * await logout(page);
 * ```
 */
export async function logout(page: Page): Promise<void> {
  // 사용자 메뉴 열기 (Clerk UserButton)
  await page.click('[data-testid="user-button"]');

  // 로그아웃 버튼 클릭
  await page.click("text=Sign out");

  // 로그인 페이지로 리디렉션될 때까지 대기
  await page.waitForURL(/\/sign-in/, { timeout: 5000 });
}

/**
 * 관리자로 로그인
 *
 * @param page - Playwright Page 객체
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, testUsers.admin.email, testUsers.admin.password);
}

/**
 * 팀장으로 로그인
 *
 * @param page - Playwright Page 객체
 */
export async function loginAsLeader(page: Page): Promise<void> {
  await login(page, testUsers.leader.email, testUsers.leader.password);
}

/**
 * 작업치료사로 로그인
 *
 * @param page - Playwright Page 객체
 */
export async function loginAsSpecialist(page: Page): Promise<void> {
  await login(page, testUsers.specialist.email, testUsers.specialist.password);
}
