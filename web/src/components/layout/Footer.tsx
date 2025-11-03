"use client";

import Link from "next/link";
import { Building2, Mail, Phone, ExternalLink } from "lucide-react";

/**
 * 하단 푸터 네비게이션 (FNB)
 * 사이트 정보, 링크, 연락처 정보 제공
 */
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* 브랜드 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 p-2">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-neutral-900">AT-CMP</span>
            </div>
            <p className="text-sm text-neutral-600">
              보조공학 사례관리 플랫폼
            </p>
            <p className="text-xs text-neutral-500">
              © 2024 AT-CMP. All rights reserved.
            </p>
          </div>

          {/* 빠른 링크 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">빠른 링크</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-neutral-600 transition-colors hover:text-primary-600"
                >
                  대시보드
                </Link>
              </li>
              <li>
                <Link
                  href="/clients"
                  className="text-sm text-neutral-600 transition-colors hover:text-primary-600"
                >
                  대상자 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/equipment"
                  className="text-sm text-neutral-600 transition-colors hover:text-primary-600"
                >
                  기기 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/schedules"
                  className="text-sm text-neutral-600 transition-colors hover:text-primary-600"
                >
                  일정 관리
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">지원</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/settings/notifications"
                  className="text-sm text-neutral-600 transition-colors hover:text-primary-600"
                >
                  알림 설정
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-primary-600"
                >
                  도움말
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-primary-600"
                >
                  사용 가이드
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* 연락처 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">연락처</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-neutral-500" />
                <span className="text-sm text-neutral-600">02-1234-5678</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-neutral-500" />
                <span className="text-sm text-neutral-600">support@atcmp.kr</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 구분선 및 버전 정보 */}
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-neutral-500">AT-CMP v1.0.0</p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-xs text-neutral-500 transition-colors hover:text-neutral-900"
              >
                개인정보처리방침
              </Link>
              <Link
                href="#"
                className="text-xs text-neutral-500 transition-colors hover:text-neutral-900"
              >
                이용약관
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
