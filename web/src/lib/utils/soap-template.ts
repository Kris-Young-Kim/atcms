/**
 * SOAP 템플릿 자동 삽입 유틸리티
 * Sprint 1: CMS-US-04
 *
 * SOAP: Subjective(주관적), Objective(객관적), Assessment(평가), Plan(계획)
 */

/**
 * SOAP 템플릿 데이터 구조
 *
 * SOAP: Subjective(주관적), Objective(객관적), Assessment(평가), Plan(계획)
 */
export interface SOAPTemplate {
  /** 주관적 정보 (환자가 호소하는 증상) */
  subjective: string;

  /** 객관적 정보 (관찰된 정보) */
  objective: string;

  /** 평가 (평가 내용) */
  assessment: string;

  /** 계획 (치료 계획) */
  plan: string;
}

/**
 * 기본 SOAP 템플릿을 생성합니다.
 *
 * 모든 필드가 빈 문자열로 초기화된 템플릿을 반환합니다.
 *
 * @returns {SOAPTemplate} 빈 SOAP 템플릿 객체
 *
 * @example
 * ```typescript
 * const template = createSOAPTemplate();
 * template.subjective = "환자가 호소하는 증상";
 * template.objective = "관찰된 객관적 정보";
 * template.assessment = "평가 내용";
 * template.plan = "치료 계획";
 * ```
 */
export function createSOAPTemplate(): SOAPTemplate {
  return {
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  };
}

/**
 * SOAP 템플릿을 마크다운 형식의 텍스트로 변환합니다.
 *
 * 비어있는 섹션은 제외하고, 각 섹션을 마크다운 헤더 형식으로 포맷팅합니다.
 *
 * @param {SOAPTemplate} soap - 변환할 SOAP 템플릿 객체
 * @returns {string} 마크다운 형식의 텍스트
 *
 * @example
 * ```typescript
 * const soap = {
 *   subjective: "두통",
 *   objective: "체온 37.5도",
 *   assessment: "감기 의심",
 *   plan: "약물 처방"
 * };
 * const text = formatSOAPToText(soap);
 * // "## S (Subjective - 주관적)\n\n두통\n\n## O (Objective - 객관적)\n\n..."
 * ```
 */
export function formatSOAPToText(soap: SOAPTemplate): string {
  // SOAP 섹션 배열 생성 (라벨과 내용 포함)
  const sections = [
    { label: "S (Subjective - 주관적)", content: soap.subjective },
    { label: "O (Objective - 객관적)", content: soap.objective },
    { label: "A (Assessment - 평가)", content: soap.assessment },
    { label: "P (Plan - 계획)", content: soap.plan },
  ];

  // 비어있는 섹션 제거 후 마크다운 형식으로 변환
  // 각 섹션을 "## 라벨\n\n내용" 형식으로 포맷팅하고, "\n\n"로 연결
  return sections
    .filter((section) => section.content.trim()) // 빈 내용 제거
    .map((section) => `## ${section.label}\n\n${section.content}`) // 마크다운 헤더 형식으로 변환
    .join("\n\n"); // 섹션 간 구분자로 연결
}

/**
 * 마크다운 형식의 텍스트를 SOAP 템플릿 객체로 파싱합니다.
 *
 * 텍스트에서 SOAP 섹션을 찾아 각 필드에 추출합니다.
 * 섹션이 없으면 빈 문자열로 설정됩니다.
 *
 * @param {string} text - 파싱할 마크다운 형식의 텍스트
 * @returns {SOAPTemplate} 파싱된 SOAP 템플릿 객체
 *
 * @example
 * ```typescript
 * const text = "## S (Subjective - 주관적)\n\n두통\n\n## O (Objective - 객관적)\n\n체온 37.5도";
 * const soap = parseTextToSOAP(text);
 * // { subjective: "두통", objective: "체온 37.5도", assessment: "", plan: "" }
 * ```
 */
export function parseTextToSOAP(text: string): SOAPTemplate {
  // 빈 SOAP 템플릿 객체 초기화
  const soap: SOAPTemplate = {
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  };

  // SOAP 섹션 매칭 패턴 정의
  // 각 패턴은 마크다운 헤더 형식(## S (Subjective - 주관적))을 찾고,
  // 다음 헤더나 문자열 끝까지의 내용을 캡처합니다
  // (?=\n##|$): 긍정적 lookahead로 다음 헤더나 문자열 끝까지 매칭
  const patterns = [
    { key: "subjective" as keyof SOAPTemplate, regex: /##\s*S\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
    { key: "objective" as keyof SOAPTemplate, regex: /##\s*O\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
    { key: "assessment" as keyof SOAPTemplate, regex: /##\s*A\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
    { key: "plan" as keyof SOAPTemplate, regex: /##\s*P\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
  ];

  // 각 패턴을 순회하며 텍스트에서 해당 섹션 추출
  // match[1]은 첫 번째 캡처 그룹(실제 내용)을 의미
  patterns.forEach(({ key, regex }) => {
    const match = text.match(regex);
    if (match && match[1]) {
      soap[key] = match[1].trim(); // 공백 제거 후 저장
    }
  });

  return soap;
}

/**
 * SOAP 템플릿이 비어있는지 확인합니다.
 *
 * 모든 필드가 빈 문자열이면 `true`를 반환합니다.
 *
 * @param {SOAPTemplate} soap - 확인할 SOAP 템플릿 객체
 * @returns {boolean} 모든 필드가 비어있으면 `true`
 */
export function isSOAPEmpty(soap: SOAPTemplate): boolean {
  return !soap.subjective && !soap.objective && !soap.assessment && !soap.plan;
}
