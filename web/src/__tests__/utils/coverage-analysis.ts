/**
 * 테스트 커버리지 분석 및 개선 스크립트
 * 
 * 커버리지 리포트를 생성하고 분석하는 유틸리티 스크립트입니다.
 */

/**
 * 커버리지 리포트 생성
 * 
 * 사용법:
 * ```bash
 * cd web
 * pnpm test:ci
 * ```
 * 
 * 커버리지 리포트 위치:
 * - HTML: web/coverage/lcov-report/index.html
 * - LCOV: web/coverage/lcov.info
 */
export const coverageReportPaths = {
  html: "web/coverage/lcov-report/index.html",
  lcov: "web/coverage/lcov.info",
};

/**
 * 커버리지 목표
 */
export const coverageTargets = {
  statements: 70,
  branches: 70,
  functions: 70,
  lines: 70,
};

/**
 * 커버리지가 낮은 파일 식별 가이드
 * 
 * 1. 커버리지 리포트 생성
 *    - `pnpm test:ci` 실행
 * 
 * 2. HTML 리포트 확인
 *    - `web/coverage/lcov-report/index.html` 열기
 *    - 각 파일의 커버리지 퍼센트 확인
 * 
 * 3. 우선순위 설정
 *    - 커버리지 0%인 파일: 최우선
 *    - 커버리지 50% 미만: 높음
 *    - 커버리지 50-70%: 중간
 *    - 커버리지 70% 이상: 낮음
 * 
 * 4. 테스트 작성
 *    - 우선순위 높은 파일부터 테스트 작성
 *    - 핵심 비즈니스 로직 우선
 *    - 에러 처리 경로 포함
 */

/**
 * 커버리지 개선 체크리스트
 */
export const coverageImprovementChecklist = [
  "API Routes 테스트 작성",
  "유틸리티 함수 테스트 작성",
  "컴포넌트 테스트 작성",
  "에러 처리 경로 테스트 추가",
  "경계 값 테스트 추가",
  "커버리지 70% 이상 달성 확인",
];

