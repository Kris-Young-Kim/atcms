/**
 * 계약서 PDF 생성 유틸리티 (Stub)
 * Sprint 1: ERM-US-02
 *
 * 향후 Toss 연계 대비하여 Stub 구현
 * 실제 PDF 생성은 라이브러리(jspdf, pdfkit 등)를 사용하여 구현 예정
 */

export interface RentalContractData {
  rentalId: string;
  equipmentName: string;
  clientName: string;
  rentalDate: string;
  expectedReturnDate?: string;
  quantity: number;
  notes?: string;
}

/**
 * 계약서 PDF 생성 Stub
 * @param data 계약서 데이터
 * @returns PDF URL (현재는 빈 문자열 반환)
 */
export async function generateRentalContractPDF(
  data: RentalContractData,
): Promise<string> {
  // TODO: 실제 PDF 생성 로직 구현
  // 예시:
  // 1. PDF 라이브러리 사용 (jspdf, pdfkit 등)
  // 2. 템플릿 적용
  // 3. Supabase Storage에 업로드
  // 4. 업로드된 URL 반환

  console.log("[Stub] 계약서 PDF 생성 요청:", data);

  // 현재는 빈 문자열 반환
  // 향후 실제 PDF 생성 후 Supabase Storage URL 반환
  return "";
}

/**
 * 계약서 템플릿 데이터 준비
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

