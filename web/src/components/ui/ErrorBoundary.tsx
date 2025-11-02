"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * 애플리케이션 전체 오류를 캐치하여 사용자 친화적인 UI 제공
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-error-100">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-neutral-900">오류가 발생했습니다</h2>
              <p className="mb-6 text-sm text-neutral-600">
                예상치 못한 문제가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
              </p>
              {this.state.error && process.env.NODE_ENV === "development" && (
                <details className="mb-4 rounded-lg bg-neutral-50 p-3 text-left">
                  <summary className="mb-2 cursor-pointer text-xs font-semibold text-neutral-700">
                    오류 상세 정보 (개발 모드)
                  </summary>
                  <pre className="max-h-32 overflow-auto text-xs text-error-600">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="flex gap-3">
                <Button variant="primary" onClick={this.handleReset} className="flex-1">
                  홈으로 이동
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
