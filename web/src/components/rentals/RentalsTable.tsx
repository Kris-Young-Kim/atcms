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

import type { Rental } from "@/lib/validations/rental";
import { RENTAL_STATUS_LABELS, type RentalStatus } from "@/lib/validations/rental";
import { useUserRole } from "@/components/auth/ProtectedRoute";

/**
 * 대여 목록 테이블 컴포넌트
 * Sprint 1: ERM-US-02
 */

interface RentalsTableProps {
  rentals: Rental[];
  onReturn?: (rentalId: string) => void;
}

export function RentalsTable({ rentals, onReturn }: RentalsTableProps) {
  const router = useRouter();
  const { hasRole } = useUserRole();
  const [sorting, setSorting] = useState<SortingState>([]);
  const canReturn = hasRole(["admin", "leader", "technician"]);

  const statusColors: Record<RentalStatus, string> = {
    active: "bg-blue-100 text-blue-700",
    returned: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  const columns: ColumnDef<Rental>[] = [
    {
      accessorKey: "id",
      header: "대여 ID",
      cell: ({ row }) => (
        <Link
          href={`/rentals/${row.original.id}`}
          className="font-mono text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          {row.original.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      accessorKey: "equipment",
      header: "기기",
      cell: ({ row }) => {
        const equipment = row.original.equipment;
        return equipment ? (
          <Link
            href={`/equipment/${row.original.equipment_id}`}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            {equipment.name}
          </Link>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "client",
      header: "대상자",
      cell: ({ row }) => {
        const client = row.original.client;
        return client ? (
          <Link
            href={`/clients/${row.original.client_id}`}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            {client.name}
          </Link>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "rental_date",
      header: "대여일",
      cell: ({ row }) =>
        row.original.rental_date
          ? new Date(row.original.rental_date).toLocaleDateString("ko-KR")
          : "-",
    },
    {
      accessorKey: "expected_return_date",
      header: "예상 반납일",
      cell: ({ row }) =>
        row.original.expected_return_date
          ? new Date(row.original.expected_return_date).toLocaleDateString("ko-KR")
          : "-",
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => {
        const status = row.original.status as RentalStatus;
        return (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
            {RENTAL_STATUS_LABELS[status]}
          </span>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "수량",
      cell: ({ row }) => row.original.quantity || 1,
    },
    {
      id: "actions",
      header: "작업",
      cell: ({ row }) => {
        const rental = row.original;
        const isActive = rental.status === "active";

        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/rentals/${rental.id}`}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              상세
            </Link>
            {canReturn && isActive && onReturn && (
              <button
                onClick={() => onReturn(rental.id)}
                className="text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                반납 처리
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: rentals,
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
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="대여 목록 테이블">
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
      {rentals.length === 0 && (
        <div className="p-12 text-center text-gray-500">등록된 대여 기록이 없습니다.</div>
      )}
    </div>
  );
}

