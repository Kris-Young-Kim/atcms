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
          className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200"
          role="table"
          aria-label="대상자 목록 테이블"
        >
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
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
                            ? "cursor-pointer select-none hover:text-gray-700"
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
          <tbody className="divide-y divide-gray-100 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-blue-50/50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900"
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
