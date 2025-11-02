"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import clsx from "clsx";

/**
 * 공통 Button 컴포넌트
 * Wishket 스타일 기반으로 명확한 상태 피드백 제공
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  href?: string;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      href,
      asChild,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-800 active:translate-y-0 active:shadow-sm",
      secondary:
        "bg-white text-neutral-700 border border-neutral-300 shadow-sm hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-md hover:-translate-y-0.5 active:bg-neutral-100 active:translate-y-0 active:shadow-sm",
      ghost: "bg-transparent text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100",
      danger:
        "bg-error-600 text-white shadow-sm hover:bg-error-700 hover:shadow-md hover:-translate-y-0.5 active:bg-error-800 active:translate-y-0 active:shadow-sm",
      success:
        "bg-success-600 text-white shadow-sm hover:bg-success-700 hover:shadow-md hover:-translate-y-0.5 active:bg-success-800 active:translate-y-0 active:shadow-sm",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-md",
      md: "px-4 py-2 text-sm rounded-lg",
      lg: "px-6 py-3 text-base rounded-lg",
    };

    const classes = clsx(baseStyles, variants[variant], sizes[size], className);

    const content = isLoading ? (
      <>
        <Spinner size={size} />
        <span className="opacity-75">처리 중...</span>
      </>
    ) : (
      <>
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    );

    if (href || asChild) {
      return (
        <Link
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          href={href || "#"}
          className={classes}
          {...(props as any)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type="button"
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

function Spinner({ size }: { size: ButtonSize }) {
  const sizeClasses = {
    sm: "w-3 h-3 border",
    md: "w-4 h-4 border-2",
    lg: "w-5 h-5 border-2",
  };

  return (
    <span
      className={clsx(
        "inline-block animate-spin rounded-full border-neutral-200 border-t-current",
        sizeClasses[size],
      )}
      aria-hidden="true"
    />
  );
}

