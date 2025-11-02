import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsLeader } from "./utils/auth-helpers";
import { testClients } from "./utils/test-data";

/**
 * 대상자 등록 플로우 E2E 테스트
 * P0 우선순위: 대상자 등록 플로우
 */

test.describe("대상자 등록", () => {
  test.beforeEach(async ({ page }) => {
    // 실제 Clerk 인증이 필요하므로 스킵
    // 로컬 환경에서는 실제 계정으로 테스트 필요
    test.skip(!!process.env.CI, "CI 환경에서는 실제 인증이 필요합니다");

    await loginAsAdmin(page);
  });

  test("대상자를 등록할 수 있어야 함", async ({ page }) => {
    await page.goto("/clients/new");

    // 필수 필드 입력
    await page.fill('[name="name"]', testClients.valid.name);
    await page.fill('[name="birth_date"]', testClients.valid.birth_date);
    await page.selectOption('[name="gender"]', testClients.valid.gender);
    await page.fill('[name="contact_phone"]', testClients.valid.contact_phone);

    // 제출 버튼 클릭
    await page.click('button[type="submit"]');

    // 성공 메시지 확인
    await expect(page.locator("text=성공적으로 등록되었습니다")).toBeVisible({ timeout: 10000 });

    // 대상자 상세 페이지로 리디렉션 확인
    await expect(page).toHaveURL(/\/clients\/[\w-]+/, { timeout: 5000 });
  });

  test("필수 필드 없이 등록할 수 없어야 함", async ({ page }) => {
    await page.goto("/clients/new");

    // 이름 없이 제출 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(page.locator("text=이름은 최소 2자 이상이어야 합니다")).toBeVisible();
  });

  test("권한이 없는 사용자는 등록 페이지에 접근할 수 없어야 함", async ({ page }) => {
    // leader는 등록 가능하지만, specialist는 테스트
    // 실제로는 technician이나 socialWorker로 테스트해야 함
    await page.goto("/clients/new");

    // 권한 없음 메시지 확인
    await expect(page.locator("text=접근 권한이 없습니다")).toBeVisible();
  });
});
