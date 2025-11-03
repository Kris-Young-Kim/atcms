/**
 * Toast 컴포넌트 사용 예시
 *
 * 이 파일은 참고용 예시입니다.
 */

"use client";

import { useToast, ToastContainer } from "@/components/ui/Toast";

// 예시 1: 기본 사용법
function Example1() {
  const { toasts, removeToast, success, error, warning, info } = useToast();

  const handleSuccess = () => {
    success("작업이 성공적으로 완료되었습니다.");
  };

  const handleError = () => {
    error("오류가 발생했습니다.");
  };

  const handleWarning = () => {
    warning("주의가 필요합니다.");
  };

  const handleInfo = () => {
    info("정보를 확인하세요.");
  };

  return (
    <>
      <div className="space-x-2">
        <button onClick={handleSuccess}>성공 Toast</button>
        <button onClick={handleError}>오류 Toast</button>
        <button onClick={handleWarning}>경고 Toast</button>
        <button onClick={handleInfo}>정보 Toast</button>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

// 예시 2: 커스텀 duration 사용
function Example2() {
  const { toasts, removeToast, success, error } = useToast();

  const handleLongToast = () => {
    success("이 Toast는 5초 동안 표시됩니다.", 5000);
  };

  const handleQuickToast = () => {
    error("이 Toast는 1초 동안만 표시됩니다.", 1000);
  };

  return (
    <>
      <div className="space-x-2">
        <button onClick={handleLongToast}>긴 Toast (5초)</button>
        <button onClick={handleQuickToast}>짧은 Toast (1초)</button>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

// 예시 3: 다른 위치에 Toast 표시
function Example3() {
  const { toasts, removeToast, info } = useToast();

  const showTopLeft = () => {
    info("왼쪽 상단에 표시됩니다.");
  };

  const showBottomCenter = () => {
    info("하단 중앙에 표시됩니다.");
  };

  return (
    <>
      <div className="space-x-2">
        <button onClick={showTopLeft}>왼쪽 상단</button>
        <button onClick={showBottomCenter}>하단 중앙</button>
      </div>
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position="top-left" // 또는 "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center"
      />
    </>
  );
}

// 예시 4: 모든 Toast 제거
function Example4() {
  const { toasts, removeToast, clearAll, success } = useToast();

  const showMultipleToasts = () => {
    success("첫 번째 Toast");
    setTimeout(() => success("두 번째 Toast"), 500);
    setTimeout(() => success("세 번째 Toast"), 1000);
  };

  return (
    <>
      <div className="space-x-2">
        <button onClick={showMultipleToasts}>여러 Toast 표시</button>
        <button onClick={clearAll}>모두 제거</button>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export { Example1, Example2, Example3, Example4 };
