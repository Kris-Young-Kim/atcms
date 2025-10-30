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

import type { Client } from "@/lib/validations/client";

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
          className="font-medium text-blue-600 hover:text-blue-700"
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
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
        );
      },
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort() ? "cursor-pointer select-none" : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="ml-1">
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
    </div>
  );
}

