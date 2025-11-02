// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// API Route 테스트를 위한 전역 설정
// Node.js 18+에서는 fetch, Request, Response가 내장되어 있지만,
// Jest 환경에서는 명시적으로 설정이 필요할 수 있음
// 단, API Route 테스트는 현재 스킵되므로 이 설정은 미사용
if (typeof global.Request === "undefined") {
  try {
    // Node.js 18+ 내장 fetch API 사용 시도
    const nodeVersion = process.version;
    if (nodeVersion.startsWith("v18") || nodeVersion.startsWith("v20") || nodeVersion.startsWith("v22")) {
      // Node.js 18+에서는 fetch가 내장되어 있음
      // Request, Response는 globalThis에서 사용 가능
      if (typeof globalThis.Request !== "undefined") {
        global.Request = globalThis.Request;
        global.Response = globalThis.Response;
        global.Headers = globalThis.Headers;
      }
    }
  } catch (error) {
    // 에러가 발생해도 무시 (API Route 테스트는 현재 스킵됨)
    console.warn("Request/Response setup failed:", error);
  }
}
