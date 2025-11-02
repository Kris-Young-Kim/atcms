/**
 * 함수 실행을 지연시킵니다 (Debounce).
 * 
 * 지정된 시간 동안 연속된 호출을 무시하고, 마지막 호출 후에만 함수를 실행합니다.
 * 검색 입력 등에서 유용합니다.
 * 
 * @template T - 원본 함수 타입
 * @param {T} callback - 실행할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {(...args: Parameters<T>) => void} 지연된 함수
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Search:', query);
 * }, 300);
 * 
 * debouncedSearch('a'); // 무시됨
 * debouncedSearch('ab'); // 무시됨
 * debouncedSearch('abc'); // 300ms 후 실행됨
 * ```
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

