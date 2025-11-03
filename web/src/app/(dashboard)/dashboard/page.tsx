"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/Button";
import { SkeletonCard, SkeletonTable } from "@/components/ui/LoadingState";

// 정적 생성을 방지 (Clerk 인증 필요)
export const dynamic = "force-dynamic";

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
    <div className="space-y-8 p-6">
      {/* 환영 메시지 */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          안녕하세요, {user?.firstName || "사용자"}님! 👋
        </h1>
        <p className="mt-2 text-base text-neutral-600">오늘도 좋은 하루 되세요.</p>
      </div>

      {/* 통계 카드 */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <div
              key={card.title}
              className="card card-hover group relative overflow-hidden p-6"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-indigo-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-neutral-900">{card.value}</p>
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
      )}

      {/* 빠른 액션 */}
      <div className="card animate-slide-in p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">빠른 액션</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" href="/clients/new">
            + 새 대상자 등록
          </Button>
          <Button variant="secondary" href="/clients">
            대상자 목록 보기
          </Button>
          <Button variant="ghost" disabled>
            상담 기록 작성 (준비 중)
          </Button>
        </div>
      </div>

      {/* 최근 등록된 대상자 */}
      <div className="card animate-slide-in p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">최근 등록된 대상자</h2>
          {!loading && (
            <Link href="/clients" className="link text-sm font-medium">
              전체 보기 →
            </Link>
          )}
        </div>

        {loading ? (
          <SkeletonTable rows={3} columns={2} />
        ) : recentClients.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-neutral-500">등록된 대상자가 없습니다.</p>
            <Link href="/clients/new" className="link mt-4 inline-block text-sm font-medium">
              첫 번째 대상자를 등록해보세요 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="card-hover flex items-center justify-between rounded-lg p-3 -mx-3 transition-colors"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{client.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    접수일: {new Date(client.intake_date).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span
                  className={`badge ${
                    client.status === "active" ? "badge-success" : "badge-neutral"
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
