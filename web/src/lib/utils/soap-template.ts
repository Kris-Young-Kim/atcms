/**
 * SOAP 템플릿 자동 삽입 유틸리티
 * Sprint 1: CMS-US-04
 * 
 * SOAP: Subjective(주관적), Objective(객관적), Assessment(평가), Plan(계획)
 */

export interface SOAPTemplate {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * 기본 SOAP 템플릿 생성
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
 * SOAP 템플릿을 텍스트 형식으로 변환
 */
export function formatSOAPToText(soap: SOAPTemplate): string {
  const sections = [
    { label: "S (Subjective - 주관적)", content: soap.subjective },
    { label: "O (Objective - 객관적)", content: soap.objective },
    { label: "A (Assessment - 평가)", content: soap.assessment },
    { label: "P (Plan - 계획)", content: soap.plan },
  ];

  return sections
    .filter((section) => section.content.trim())
    .map((section) => `## ${section.label}\n\n${section.content}`)
    .join("\n\n");
}

/**
 * 텍스트를 SOAP 형식으로 파싱 (기존 텍스트가 SOAP 형식인 경우)
 */
export function parseTextToSOAP(text: string): SOAPTemplate {
  const soap: SOAPTemplate = {
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  };

  // SOAP 섹션 매칭 패턴
  const patterns = [
    { key: "subjective" as keyof SOAPTemplate, regex: /##\s*S\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
    { key: "objective" as keyof SOAPTemplate, regex: /##\s*O\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
    { key: "assessment" as keyof SOAPTemplate, regex: /##\s*A\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
    { key: "plan" as keyof SOAPTemplate, regex: /##\s*P\s*\(.*?\)\s*\n\n(.*?)(?=\n##|$)/is },
  ];

  patterns.forEach(({ key, regex }) => {
    const match = text.match(regex);
    if (match && match[1]) {
      soap[key] = match[1].trim();
    }
  });

  return soap;
}

/**
 * SOAP 템플릿이 비어있는지 확인
 */
export function isSOAPEmpty(soap: SOAPTemplate): boolean {
  return !soap.subjective && !soap.objective && !soap.assessment && !soap.plan;
}

