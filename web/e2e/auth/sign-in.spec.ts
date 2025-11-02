import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsLeader, logout } from "./utils/auth-helpers";
import { testClients } from "./utils/test-data";

/**
 * 인증 플로우 E2E 테스트
 * P0 우선순위: 사용자 인증 플로우
 */

test.describe("인증 플로우", () => {
  test("로그인하지 않은 사용자는 대시보드에 접근할 수 없어야 함", async ({ page }) => {
    await page.goto("/dashboard");

    // 로그인 페이지로 리디렉션되어야 함
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("로그인 페이지가 정상적으로 표시되어야 함", async ({ page }) => {
    await page.goto("/sign-in");

    // Clerk SignIn 컴포넌트가 표시되어야 함
    await expect(page.locator("text=Sign in")).toBeVisible();
  });

  test("로그인 성공 후 대시보드로 리디렉션되어야 함", async ({ page }) => {
    // 실제 Clerk 인증이 필요하므로 스킵
    // 로컬 환경에서는 실제 계정으로 테스트 필요
    test.skip(!!process.env.CI, "CI 환경에서는 실제 인증이 필요합니다");

    await loginAsAdmin(page);

    // 대시보드로 리디렉션 확인
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=대시보드")).toBeVisible();
  });

  test("로그아웃 후 로그인 페이지로 리디렉션되어야 함", async ({ page }) => {
    test.skip(!!process.env.CI, "CI 환경에서는 실제 인증이 필요합니다");

    await loginAsAdmin(page);
    await logout(page);

    // 로그인 페이지로 리디렉션 확인
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
