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

import type { CustomizationRequest } from "@/lib/validations/customization";

interface CustomizationWithClient extends CustomizationRequest {
  clients?: {
    id: string;
    name: string;
  } | null;
}

/**
 * 맞춤제작 요청 목록 테이블 컴포넌트
 * Phase 10: CDM-US-02
 */

interface CustomizationsTableProps {
  data: CustomizationWithClient[];
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export function CustomizationsTable({ data, onSort }: CustomizationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const statusMap: Record<string, { label: string; class: string }> = {
    requested: { label: "요청됨", class: "bg-blue-100 text-blue-700" },
    designing: { label: "설계중", class: "bg-yellow-100 text-yellow-700" },
    prototyping: { label: "시제품 제작중", class: "bg-orange-100 text-orange-700" },
    fitting: { label: "착용 테스트", class: "bg-purple-100 text-purple-700" },
    completed: { label: "완료", class: "bg-green-100 text-green-700" },
    cancelled: { label: "취소됨", class: "bg-red-100 text-red-700" },
  };

  const columns: ColumnDef<CustomizationWithClient>[] = [
    {
      accessorKey: "title",
      header: "제목",
      cell: ({ row }) => (
        <Link
          href={`/customization-requests/${row.original.id}`}
          className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          {row.getValue("title")}
        </Link>
      ),
    },
    {
      accessorKey: "client_id",
      header: "대상자",
      cell: ({ row }) => {
        const client = row.original.clients;
        return client ? (
          <Link
            href={`/clients/${row.original.client_id}`}
            className="text-blue-600 hover:underline"
          >
            {client.name}
          </Link>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusInfo = statusMap[status] || {
          label: status,
          class: "bg-gray-100 text-gray-700",
        };
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
      accessorKey: "requested_date",
      header: "요청일",
      cell: ({ row }) => {
        const date = row.getValue("requested_date") as string | undefined;
        return date ? (
          <span className="text-gray-600">{new Date(date).toLocaleDateString("ko-KR")}</span>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "expected_completion_date",
      header: "예상 완료일",
      cell: ({ row }) => {
        const date = row.getValue("expected_completion_date") as string | undefined;
        return date ? (
          <span className="text-gray-600">{new Date(date).toLocaleDateString("ko-KR")}</span>
        ) : (
          "-"
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md">
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
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:text-gray-700"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
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
                <td key={cell.id} className="whitespace-nowrap px-6 py-4 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-12 text-center text-gray-500">맞춤제작 요청이 없습니다.</div>
      )}
    </div>
  );
}
