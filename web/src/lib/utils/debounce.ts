/**
 * 디바운스 유틸리티 함수
 * 입력값이 변경된 후 일정 시간(ms) 동안 추가 변경이 없을 때만 콜백 실행
 * 
 * @param callback 실행할 함수
 * @param delay 대기 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

