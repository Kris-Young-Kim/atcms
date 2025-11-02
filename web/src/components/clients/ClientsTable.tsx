"use client";

import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

import type { Client, ClientActivitySummary } from "@/lib/validations/client";

/**
 * 대상자 목록 테이블 (Tanstack Table)
 */

interface ClientsTableProps {
  data: Client[];
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export function ClientsTable({ data, onSort }: ClientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "이름",
      cell: ({ row }) => (
        <Link
          href={`/clients/${row.original.id}`}
          className="link font-semibold"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "gender",
      header: "성별",
      cell: ({ row }) => {
        const gender = row.getValue("gender") as string | undefined;
        const genderMap: Record<string, string> = {
          male: "남성",
          female: "여성",
          other: "기타",
        };
        return <span>{gender ? genderMap[gender] || gender : "-"}</span>;
      },
    },
    {
      accessorKey: "disability_type",
      header: "장애 유형",
      cell: ({ row }) => {
        const type = row.getValue("disability_type") as string | undefined;
        return <span>{type || "-"}</span>;
      },
    },
    {
      accessorKey: "contact_phone",
      header: "연락처",
      cell: ({ row }) => {
        const phone = row.getValue("contact_phone") as string | undefined;
        return <span className="text-gray-600">{phone || "-"}</span>;
      },
    },
    {
      accessorKey: "intake_date",
      header: "접수일",
      cell: ({ row }) => {
        const date = row.getValue("intake_date") as string | undefined;
        return date ? (
          <span className="text-gray-600">{new Date(date).toLocaleDateString("ko-KR")}</span>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusMap: Record<string, { label: string; class: string }> = {
          active: { label: "활동중", class: "bg-green-100 text-green-700" },
          inactive: { label: "비활동", class: "bg-gray-100 text-gray-700" },
          discharged: { label: "종결", class: "bg-red-100 text-red-700" },
        };
        const statusInfo = statusMap[status] || { label: status, class: "bg-gray-100" };
        return (
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusInfo.class}`}
          >
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      id: "activity_summary",
      header: "활동 요약",
      enableSorting: false,
      cell: ({ row }) => (
        <ActivitySummary summary={row.original.activity_summary} clientId={row.original.id} />
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);

      // 부모 컴포넌트에 정렬 변경 알림
      if (onSort && newSorting.length > 0) {
        const sort = newSorting[0];
        onSort(sort.id, sort.desc ? "desc" : "asc");
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">등록된 대상자가 없습니다.</p>
        <p className="mt-2 text-sm text-gray-500">새 대상자를 등록해보세요.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-neutral-200"
          role="table"
          aria-label="대상자 목록 테이블"
        >
          <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-700"
                    scope="col"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none transition-colors hover:text-neutral-900"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                        role={header.column.getCanSort() ? "button" : undefined}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (header.column.getCanSort() && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        aria-label={
                          header.column.getCanSort()
                            ? `정렬: ${flexRender(header.column.columnDef.header, header.getContext())}`
                            : undefined
                        }
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="ml-1" aria-hidden="true">
                            {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-primary-50/50 active:bg-primary-100/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivitySummary({
  summary,
  clientId,
}: {
  summary?: ClientActivitySummary;
  clientId: string;
}) {
  if (!summary) {
    return <span className="text-sm text-gray-400">-</span>;
  }

  const items: Array<{
    key: string;
    label: string;
    icon: string;
    count: number;
    type: "consultation" | "assessment" | "rental" | "customization";
    color: string;
  }> = [
    {
      key: "consultation",
      label: "상담",
      icon: "💬",
      count: summary.consultation_count,
      type: "consultation",
      color: "bg-blue-50 text-blue-700",
    },
    {
      key: "assessment",
      label: "평가",
      icon: "📋",
      count: summary.assessment_count,
      type: "assessment",
      color: "bg-purple-50 text-purple-700",
    },
    {
      key: "rental",
      label: "대여",
      icon: "📦",
      count: summary.active_rental_count,
      type: "rental",
      color: "bg-green-50 text-green-700",
    },
    {
      key: "customization",
      label: "맞춤제작",
      icon: "🔧",
      count: summary.active_customization_count,
      type: "customization",
      color: "bg-orange-50 text-orange-700",
    },
  ];

  const formattedLastActivity = formatActivityDate(summary.last_activity_at);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const badgeClass = `flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${item.color}`;
          const label = `${item.label} ${item.count}건`;

          if (item.count > 0) {
            return (
              <Link
                key={item.key}
                href={`/clients/${clientId}?tab=activities&activityType=${item.type}`}
                className={`${badgeClass} transition-transform hover:scale-105 hover:shadow-sm`}
                title={`${label} · 클릭 시 ${item.label} 활동만 보기`}
                aria-label={`${item.label} 활동 ${item.count}건 보기`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{label}</span>
              </Link>
            );
          }

          return (
            <span
              key={item.key}
              className={`${badgeClass} opacity-50`}
              title={`${item.label} 활동이 없습니다.`}
              aria-label={`${item.label} 활동이 없습니다.`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{label}</span>
            </span>
          );
        })}
      </div>
      <div className="text-xs text-gray-500">
        총 활동 {summary.total_activity_count}건
        {formattedLastActivity ? ` · 최근 ${formattedLastActivity}` : " · 최근 활동 없음"}
      </div>
    </div>
  );
}

function formatActivityDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString("ko-KR");
}
