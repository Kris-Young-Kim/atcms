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
}

export function Skeleton({ width, height, className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-200 ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="1rem" width={i === lines - 1 ? "60%" : "100%"} className="h-4" />
      ))}
    </div>
  );
}
