import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./utils/auth-helpers";
import { testEquipment, testRental } from "./utils/test-data";

/**
 * 대여 신청 프로세스 E2E 테스트
 * P0 우선순위: 대여 신청 프로세스
 */

test.describe("대여 신청", () => {
  test.beforeEach(async ({ page }) => {
    // 실제 Clerk 인증이 필요하므로 스킵
    // 로컬 환경에서는 실제 계정으로 테스트 필요
    test.skip(!!process.env.CI, "CI 환경에서는 실제 인증이 필요합니다");

    await loginAsAdmin(page);
  });

  test("대여 신청을 할 수 있어야 함", async ({ page }) => {
    await page.goto("/rentals/new");

    // 기기 선택
    await page.selectOption('[name="equipment_id"]', testRental.valid.equipment_id);

    // 대상자 선택
    await page.selectOption('[name="client_id"]', testRental.valid.client_id);

    // 대여 날짜 입력
    await page.fill('[name="rental_date"]', testRental.valid.rental_date);

    // 예상 반납 날짜 입력
    await page.fill('[name="expected_return_date"]', testRental.valid.expected_return_date);

    // 수량 입력
    await page.fill('[name="quantity"]', String(testRental.valid.quantity));

    // 제출 버튼 클릭
    await page.click('button[type="submit"]');

    // 성공 메시지 확인
    await expect(page.locator("text=성공적으로 등록되었습니다")).toBeVisible({ timeout: 10000 });

    // 대여 목록 페이지로 리디렉션 확인
    await expect(page).toHaveURL(/\/rentals/, { timeout: 5000 });
  });

  test("가용 수량이 부족하면 대여할 수 없어야 함", async ({ page }) => {
    await page.goto("/rentals/new");

    // 가용 수량이 0인 기기 선택 (실제 테스트에서는 미리 생성 필요)
    await page.selectOption('[name="equipment_id"]', "equipment_out_of_stock");

    // 대상자 선택
    await page.selectOption('[name="client_id"]', testRental.valid.client_id);

    // 제출 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(page.locator("text=가용 수량이 부족합니다")).toBeVisible({ timeout: 5000 });
  });
});
