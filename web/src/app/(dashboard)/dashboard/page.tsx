"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * 대시보드 홈 페이지
 * 통계 카드 및 최근 활동 표시
 */

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
  pendingConsultations: number;
}

interface RecentClient {
  id: string;
  name: string;
  intake_date: string;
  status: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    newThisMonth: 0,
    pendingConsultations: 0,
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentClients(data.recentClients || []);
        }
      } catch (error) {
        console.error("대시보드 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "전체 대상자",
      value: stats.totalClients,
      icon: "👥",
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "활동 중",
      value: stats.activeClients,
      icon: "✅",
      color: "bg-green-50 text-green-700",
    },
    {
      title: "이번 달 신규",
      value: stats.newThisMonth,
      icon: "📈",
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "대기 중인 상담",
      value: stats.pendingConsultations,
      icon: "📝",
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 환영 메시지 */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          안녕하세요, {user?.firstName || "사용자"}님! 👋
        </h1>
        <p className="mt-2 text-base text-gray-600">오늘도 좋은 하루 되세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-200"></span>
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div
                className={`rounded-xl p-3 text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${card.color}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빠른 액션 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md animate-slide-in">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">빠른 액션</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/clients/new"
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + 새 대상자 등록
          </Link>
          <Link
            href="/clients"
            className="rounded-lg border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            대상자 목록 보기
          </Link>
          <button
            disabled
            className="rounded-lg border-2 border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
          >
            상담 기록 작성 (준비 중)
          </button>
        </div>
      </div>

      {/* 최근 등록된 대상자 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md animate-slide-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">최근 등록된 대상자</h2>
          <Link
            href="/clients"
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
          >
            전체 보기 →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        ) : recentClients.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">등록된 대상자가 없습니다.</p>
            <Link
              href="/clients/new"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              첫 번째 대상자를 등록해보세요 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between py-4 transition-colors hover:bg-gray-50 rounded-lg px-2 -mx-2"
              >
                <div>
                  <p className="font-semibold text-gray-900">{client.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    접수일: {new Date(client.intake_date).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                    client.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {client.status === "active" ? "활동중" : client.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
