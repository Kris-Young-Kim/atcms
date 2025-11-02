/**
 * E2E 테스트 데이터
 *
 * 테스트에서 사용하는 공통 데이터를 정의합니다.
 */

/**
 * 테스트용 대상자 데이터
 */
export const testClients = {
  valid: {
    name: "E2E 테스트 대상자",
    birth_date: "1990-01-01",
    gender: "male",
    disability_type: "시각장애",
    disability_grade: "1급",
    contact_phone: "010-1234-5678",
    contact_email: "test@example.com",
    address: "서울특별시 강남구 테스트로 123",
  },
  invalid: {
    name: "", // 빈 이름
    birth_date: "2099-01-01", // 미래 날짜
    contact_phone: "123-456", // 잘못된 전화번호
  },
};

/**
 * 테스트용 기기 데이터
 */
export const testEquipment = {
  valid: {
    name: "E2E 테스트 기기",
    category: "wheelchair",
    manufacturer: "테스트 제조사",
    model: "테스트 모델",
    serial_number: `E2E-${Date.now()}`,
    purchase_date: "2024-01-01",
    status: "normal",
    quantity: 1,
    current_stock: 1,
    notes: "E2E 테스트용 기기",
  },
};

/**
 * 테스트용 대여 데이터
 */
export const testRental = {
  valid: {
    equipment_id: "equipment_001", // 실제 기기 ID로 교체 필요
    client_id: "client_001", // 실제 대상자 ID로 교체 필요
    rental_date: new Date().toISOString().split("T")[0],
    expected_return_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    quantity: 1,
    notes: "E2E 테스트 대여",
  },
};

/**
 * 테스트용 상담 기록 데이터
 */
export const testConsultation = {
  valid: {
    record_date: new Date().toISOString().split("T")[0],
    record_type: "consultation",
    soap_subjective: "두통 증상 호소",
    soap_objective: "체온 37.5도",
    soap_assessment: "감기 의심",
    soap_plan: "약물 처방 및 휴식",
    notes: "E2E 테스트 상담 기록",
  },
};

/**
 * 테스트용 평가 기록 데이터
 */
export const testAssessment = {
  valid: {
    record_date: new Date().toISOString().split("T")[0],
    record_type: "assessment",
    assessment_items: [
      {
        type: "cognitive",
        score: 85,
        notes: "인지 기능 양호",
      },
    ],
    total_score: 85,
    notes: "E2E 테스트 평가 기록",
  },
};
