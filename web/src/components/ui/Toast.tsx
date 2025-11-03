"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

/**
 * 개선된 Toast 알림 컴포넌트
 * lucide-react 아이콘 적용 및 향상된 UI/UX
 */

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 300); // 애니메이션 완료 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  const styles = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      iconBg: "bg-emerald-100 text-emerald-600",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-red-50 border-red-200 text-red-900",
      iconBg: "bg-red-100 text-red-600",
      icon: XCircle,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      iconBg: "bg-amber-100 text-amber-600",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-900",
      iconBg: "bg-blue-100 text-blue-600",
      icon: Info,
    },
  };

  const style = styles[type];
  const IconComponent = style.icon;

  return (
    <div
      className={`pointer-events-auto flex min-w-80 max-w-md items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg transition-all duration-300 ${
        style.bg
      } ${
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100"
      }`}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      {/* 아이콘 */}
      <div className={`flex-shrink-0 rounded-full p-1 ${style.iconBg}`}>
        <IconComponent className="h-5 w-5" aria-hidden="true" />
      </div>

      {/* 메시지 */}
      <p className="flex-1 text-sm font-medium leading-5">{message}</p>

      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-1"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Toast 상태 인터페이스
 */
export interface ToastState {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastId = 0;

/**
 * Toast 관리 훅
 * 여러 Toast를 관리하고 표시하는 기능 제공
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: ToastType = "info", duration?: number) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
    success: (message: string, duration?: number) => showToast(message, "success", duration),
    error: (message: string, duration?: number) => showToast(message, "error", duration),
    warning: (message: string, duration?: number) => showToast(message, "warning", duration),
    info: (message: string, duration?: number) => showToast(message, "info", duration),
  };
}

/**
 * Toast 컨테이너 컴포넌트
 * 여러 Toast를 스택 형태로 표시
 */
interface ToastContainerProps {
  toasts: ToastState[];
  onRemove: (id: number) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

export function ToastContainer({
  toasts,
  onRemove,
  position = "top-right",
}: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  const positionClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  };

  return (
    <div
      className={`pointer-events-none fixed z-[9999] flex flex-col gap-2 ${positionClasses[position]}`}
      aria-live="polite"
      aria-label="알림"
    >
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
