"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import type { Equipment } from "@/lib/validations/equipment";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
  type EquipmentStatus,
  type EquipmentCategory,
} from "@/lib/validations/equipment";
import { useUserRole } from "@/components/auth/ProtectedRoute";

/**
 * 기기 목록 테이블 컴포넌트
 * Sprint 1: ERM-US-01
 */

interface EquipmentTableProps {
  equipment: Equipment[];
  onStatusChange?: (equipmentId: string, newStatus: EquipmentStatus) => void;
  onQuantityAdjust?: (equipmentId: string) => void;
}

export function EquipmentTable({
  equipment,
  onStatusChange,
  onQuantityAdjust,
}: EquipmentTableProps) {
  const router = useRouter();
  const { hasRole } = useUserRole();
  const [sorting, setSorting] = useState<SortingState>([]);
  const canEdit = hasRole(["admin", "leader", "technician"]);
  const canDelete = hasRole(["admin", "leader"]);

  const statusColors: Record<EquipmentStatus, string> = {
    normal: "bg-green-100 text-green-700",
    maintenance: "bg-yellow-100 text-yellow-700",
    retired: "bg-red-100 text-red-700",
  };

  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: "name",
      header: "기기명",
      cell: ({ row }) => (
        <Link
          href={`/equipment/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "카테고리",
      cell: ({ row }) => {
        const category = row.original.category as EquipmentCategory | undefined;
        return category ? EQUIPMENT_CATEGORY_LABELS[category] : "-";
      },
    },
    {
      accessorKey: "brand",
      header: "브랜드",
      cell: ({ row }) => row.original.brand || "-",
    },
    {
      accessorKey: "model",
      header: "모델명",
      cell: ({ row }) => row.original.model || "-",
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => {
        const status = row.original.status as EquipmentStatus;
        return (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
            {EQUIPMENT_STATUS_LABELS[status]}
          </span>
        );
      },
    },
    {
      accessorKey: "total_quantity",
      header: "전체 수량",
      cell: ({ row }) => row.original.total_quantity || 0,
    },
    {
      accessorKey: "available_quantity",
      header: "가용 수량",
      cell: ({ row }) => {
        const available = row.original.available_quantity || 0;
        const total = row.original.total_quantity || 0;
        const rented = total - available;
        return (
          <div className="space-y-1">
            <span className="font-medium">{available}</span>
            {rented > 0 && (
              <span className="ml-2 text-xs text-gray-500">(대여중: {rented})</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "보관 위치",
      cell: ({ row }) => row.original.location || "-",
    },
    {
      id: "actions",
      header: "작업",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => router.push(`/equipment/${row.original.id}/edit`)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                수정
              </button>
              {onStatusChange && (
                <button
                  onClick={() => {
                    const currentStatus = row.original.status as EquipmentStatus;
                    const newStatus =
                      currentStatus === "normal"
                        ? "maintenance"
                        : currentStatus === "maintenance"
                          ? "normal"
                          : null;
                    if (newStatus) {
                      onStatusChange(row.original.id, newStatus);
                    }
                  }}
                  className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline"
                  disabled={row.original.status === "retired"}
                >
                  상태 변경
                </button>
              )}
              {onQuantityAdjust && (
                <button
                  onClick={() => onQuantityAdjust(row.original.id)}
                  className="text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  수량 조정
                </button>
              )}
            </>
          )}
          {canDelete && (
            <button
              onClick={async () => {
                if (confirm("정말 이 기기를 삭제하시겠습니까?")) {
                  const response = await fetch(`/api/equipment/${row.original.id}`, {
                    method: "DELETE",
                  });
                  if (response.ok) {
                    router.refresh();
                  }
                }
              }}
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              삭제
            </button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: equipment,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="기기 목록 테이블">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
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
                            ? "cursor-pointer select-none hover:text-gray-700 flex items-center gap-1"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        role={header.column.getCanSort() ? "button" : undefined}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && (
                          <span className="text-xs" aria-label="오름차순 정렬">▲</span>
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <span className="text-xs" aria-label="내림차순 정렬">▼</span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {equipment.length === 0 && (
        <div className="p-12 text-center text-gray-500">등록된 기기가 없습니다.</div>
      )}
    </div>
  );
}

