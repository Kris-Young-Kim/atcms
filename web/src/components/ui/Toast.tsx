"use client";

import { useEffect, useState } from "react";

/**
 * 간단한 Toast 알림 컴포넌트
 * Sprint 1: CMS-US-01
 */

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 애니메이션 완료 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ⓘ",
  };

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex min-w-80 items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${
        bgColors[type]
      } ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
      role="alert"
    >
      <span className="text-xl">{icons[type]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-lg leading-none opacity-60 hover:opacity-100"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Toast 관리 훅
 */
interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message: string) => showToast(message, "success"),
    error: (message: string) => showToast(message, "error"),
    info: (message: string) => showToast(message, "info"),
  };
}

/**
 * Toast 컨테이너 컴포넌트
 */
interface ToastContainerProps {
  toasts: ToastState[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-2 p-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
