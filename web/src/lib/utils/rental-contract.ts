/**
 * 계약서 PDF 생성 유틸리티 (Stub)
 * Sprint 1: ERM-US-02
 *
 * 향후 Toss 연계 대비하여 Stub 구현
 * 실제 PDF 생성은 라이브러리(jspdf, pdfkit 등)를 사용하여 구현 예정
 */

/**
 * 대여 계약서 데이터 구조
 *
 * 계약서 PDF 생성에 필요한 정보를 담는 인터페이스입니다.
 */
export interface RentalContractData {
  /** 대여 ID */
  rentalId: string;

  /** 기기명 */
  equipmentName: string;

  /** 대상자명 */
  clientName: string;

  /** 대여일 (YYYY-MM-DD 형식) */
  rentalDate: string;

  /** 예상 반납일 (YYYY-MM-DD 형식, 선택) */
  expectedReturnDate?: string;

  /** 대여 수량 */
  quantity: number;

  /** 추가 메모 (선택) */
  notes?: string;
}

/**
 * 계약서 PDF를 생성합니다 (Stub 구현).
 *
 * 현재는 Stub 구현으로, 실제 PDF를 생성하지 않고 빈 문자열을 반환합니다.
 * 향후 PDF 라이브러리(jspdf, pdfkit 등)를 사용하여 실제 구현 예정입니다.
 *
 * @param {RentalContractData} data - 계약서 데이터
 * @returns {Promise<string>} PDF URL (현재는 빈 문자열 반환)
 *
 * @example
 * ```typescript
 * const contractData = {
 *   rentalId: "uuid",
 *   equipmentName: "휠체어",
 *   clientName: "홍길동",
 *   rentalDate: "2025-11-01",
 *   quantity: 1
 * };
 * const pdfUrl = await generateRentalContractPDF(contractData);
 * ```
 */
export async function generateRentalContractPDF(data: RentalContractData): Promise<string> {
  // TODO: 실제 PDF 생성 로직 구현
  // 예시:
  // 1. PDF 라이브러리 사용 (jspdf, pdfkit 등)
  // 2. 템플릿 적용
  // 3. Supabase Storage에 업로드
  // 4. 업로드된 URL 반환

  // 개발 환경에서만 로그 출력
  if (process.env.NODE_ENV === "development") {
    console.warn("[Stub] 계약서 PDF 생성 요청:", data);
  }

  // 현재는 빈 문자열 반환
  // 향후 실제 PDF 생성 후 Supabase Storage URL 반환
  return "";
}

/**
 * 계약서 템플릿 데이터를 문자열 형식으로 준비합니다.
 *
 * 계약서에 표시할 내용을 텍스트 형식으로 포맷팅합니다.
 * 향후 실제 PDF 생성 시 사용됩니다.
 *
 * @param {RentalContractData} data - 계약서 데이터
 * @returns {string} 포맷팅된 계약서 텍스트
 */
export function prepareContractData(data: RentalContractData): string {
  // 계약서 템플릿 데이터를 문자열로 준비
  // 향후 실제 PDF 생성 시 사용
  return `
대여 계약서

대여 ID: ${data.rentalId}
기기명: ${data.equipmentName}
대상자명: ${data.clientName}
대여일: ${data.rentalDate}
예상 반납일: ${data.expectedReturnDate || "미정"}
수량: ${data.quantity}개
${data.notes ? `메모: ${data.notes}` : ""}

본 계약서는 기기 대여 시 자동 생성됩니다.
  `.trim();
}
