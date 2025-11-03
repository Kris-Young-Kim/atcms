"use client";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * 로딩 상태 컴포넌트
 * 명확하고 세련된 로딩 UI 제공
 */
export function LoadingState({
  message = "로딩 중...",
  fullScreen = false,
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`animate-spin rounded-full border-neutral-200 border-t-primary-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="로딩 중"
      >
        <span className="sr-only">{message}</span>
      </div>
      {message && <p className="text-sm font-medium text-neutral-600 animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">{spinner}</div>
    );
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

/**
 * 기본 Skeleton 컴포넌트
 */
export function Skeleton({ width, height, className = "", rounded = "md" }: SkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div
      className={`animate-pulse bg-neutral-200 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * 텍스트 줄 Skeleton
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="1rem" width={i === lines - 1 ? "60%" : "100%"} className="h-4" />
      ))}
    </div>
  );
}

/**
 * 카드 Skeleton (통계 카드용)
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-6 ${className}`}>
      <Skeleton height="1rem" width="40%" className="mb-4 h-4" />
      <Skeleton height="2rem" width="60%" className="mb-2 h-8" />
      <Skeleton height="0.875rem" width="50%" className="h-3.5" />
    </div>
  );
}

/**
 * 테이블 Skeleton
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      {/* 테이블 헤더 */}
      <div className="border-b border-neutral-200 bg-neutral-50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="1rem" width="20%" className="h-4" />
          ))}
        </div>
      </div>
      {/* 테이블 행 */}
      <div className="divide-y divide-neutral-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height="1rem" width="20%" className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 폼 Skeleton
 */
export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height="1rem" width="30%" className="h-4" />
          <Skeleton height="2.5rem" width="100%" className="h-10" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton height="2.5rem" width="100px" className="h-10" />
        <Skeleton height="2.5rem" width="100px" className="h-10" />
      </div>
    </div>
  );
}

/**
 * 페이지 레이아웃 Skeleton
 */
export function SkeletonPage({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* 페이지 헤더 */}
      <div className="space-y-2">
        <Skeleton height="2rem" width="200px" className="h-8" />
        <Skeleton height="1rem" width="400px" className="h-4" />
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* 테이블 */}
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}
