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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          안녕하세요, {user?.firstName || "사용자"}님! 👋
        </h1>
        <p className="mt-2 text-sm text-gray-600">오늘도 좋은 하루 되세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? "..." : card.value}
                </p>
              </div>
              <div className={`rounded-full p-3 text-2xl ${card.color}`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 빠른 액션 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">빠른 액션</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/clients/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 새 대상자 등록
          </Link>
          <Link
            href="/clients"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            대상자 목록 보기
          </Link>
          <button
            disabled
            className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
          >
            상담 기록 작성 (준비 중)
          </button>
        </div>
      </div>

      {/* 최근 등록된 대상자 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">최근 등록된 대상자</h2>
          <Link href="/clients" className="text-sm text-blue-600 hover:text-blue-700">
            전체 보기 →
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-500">로딩 중...</p>
        ) : recentClients.length === 0 ? (
          <p className="text-center text-sm text-gray-500">등록된 대상자가 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">
                    접수일: {new Date(client.intake_date).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    client.status === "active"
                      ? "bg-green-100 text-green-700"
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

