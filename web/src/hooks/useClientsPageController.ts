"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReadonlyURLSearchParams } from "next/navigation";

import { auditLogger } from "@/lib/logger/auditLogger";
import { debounce } from "@/lib/utils/debounce";
import type { Client } from "@/lib/validations/client";
import type { ClientListFilters } from "@/components/clients/ClientsFilter";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseClientsPageControllerParams {
  router: AppRouterInstance;
  searchParams: ReadonlyURLSearchParams;
}

interface UseClientsPageControllerReturn {
  clients: Client[];
  filters: ClientListFilters;
  loading: boolean;
  pagination: Pagination;
  handleFilterChange: (
    newFilters: ClientListFilters,
    options: { type: "search" | "apply" | "reset" },
  ) => void;
  handleSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  handlePageChange: (newPage: number) => void;
}

function setFilterParams(params: URLSearchParams, filters: ClientListFilters) {
  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.activityTypes.length > 0) {
    params.set("activityTypes", filters.activityTypes.join(","));
  }
  if (filters.minActivityCount) {
    params.set("minActivityCount", filters.minActivityCount);
  }
  if (filters.maxActivityCount) {
    params.set("maxActivityCount", filters.maxActivityCount);
  }
  if (filters.activitySince) {
    params.set("activitySince", filters.activitySince);
  }
}

function setSortingParams(
  params: URLSearchParams,
  sorting: { sortBy: string; sortOrder: "asc" | "desc" },
  options: { skipDefaults?: boolean } = {},
) {
  const { skipDefaults = false } = options;
  if (!skipDefaults || sorting.sortBy !== "created_at") {
    params.set("sortBy", sorting.sortBy);
  }
  if (!skipDefaults || sorting.sortOrder !== "desc") {
    params.set("sortOrder", sorting.sortOrder);
  }
}

function useFiltersState(searchParams: ReadonlyURLSearchParams) {
  const searchParamsKey = searchParams.toString();
  const searchParamsSnapshot = useMemo(
    () => new URLSearchParams(searchParamsKey),
    [searchParamsKey],
  );

  const pageParam = useMemo(
    () => parseInt(searchParamsSnapshot.get("page") || "1", 10),
    [searchParamsSnapshot],
  );

  const initialFilters = useMemo<ClientListFilters>(
    () => ({
      search: searchParamsSnapshot.get("search") || "",
      status: searchParamsSnapshot.get("status") || "all",
      activityTypes:
        searchParamsSnapshot
          .get("activityTypes")
          ?.split(",")
          .map((value) => value.trim())
          .filter(Boolean) || [],
      minActivityCount: searchParamsSnapshot.get("minActivityCount") || "",
      maxActivityCount: searchParamsSnapshot.get("maxActivityCount") || "",
      activitySince: searchParamsSnapshot.get("activitySince") || "",
    }),
    [searchParamsSnapshot],
  );

  const [filters, setFilters] = useState<ClientListFilters>(initialFilters);
  const [sorting, setSorting] = useState({
    sortBy: searchParamsSnapshot.get("sortBy") || "created_at",
    sortOrder: (searchParamsSnapshot.get("sortOrder") || "desc") as "asc" | "desc",
  });

  const filtersRef = useRef(filters);
  const sortingRef = useRef(sorting);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    sortingRef.current = sorting;
  }, [sorting]);

  useEffect(() => {
    setFilters(initialFilters);
    setSorting({
      sortBy: searchParamsSnapshot.get("sortBy") || "created_at",
      sortOrder: (searchParamsSnapshot.get("sortOrder") || "desc") as "asc" | "desc",
    });
  }, [initialFilters, searchParamsSnapshot]);

  return {
    filters,
    setFilters,
    sorting,
    setSorting,
    filtersRef,
    sortingRef,
    initialFilters,
    pageParam,
  } as const;
}

export function useClientsPageController({
  router,
  searchParams,
}: UseClientsPageControllerParams): UseClientsPageControllerReturn {
  const { filters, setFilters, sorting, setSorting, filtersRef, sortingRef, pageParam } =
    useFiltersState(searchParams);
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: pageParam,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: pageParam,
    }));
  }, [pageParam]);

  const updateURL = useCallback(
    (newFilters: ClientListFilters, newSorting: typeof sorting, newPage: number) => {
      const params = new URLSearchParams();
      setFilterParams(params, newFilters);
      setSortingParams(params, newSorting, { skipDefaults: true });
      if (newPage > 1) params.set("page", newPage.toString());

      router.replace(`/clients?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      setFilterParams(params, filters);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      setSortingParams(params, sorting);

      const response = await fetch(`/api/clients?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("대상자 목록 로드 실패:", error);
      auditLogger.error("clients_list_fetch_failed", {
        error,
        metadata: {
          filters,
          sorting,
          page: pagination.page,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.page, sorting]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        const nextFilters = { ...filtersRef.current, search: searchValue };
        setFilters(nextFilters);
        setPagination((prev) => ({ ...prev, page: 1 }));
        updateURL(nextFilters, sortingRef.current, 1);

        if (searchValue) {
          auditLogger.info("clients_search_executed", {
            metadata: { searchQuery: searchValue },
          });
        }
      }, 300),
    [filtersRef, setFilters, setPagination, sortingRef, updateURL],
  );

  const handleFilterChange = useCallback(
    (newFilters: ClientListFilters, options: { type: "search" | "apply" | "reset" }) => {
      if (options.type === "search") {
        debouncedSearch(newFilters.search);
        return;
      }

      setFilters(newFilters);
      filtersRef.current = newFilters;
      setPagination((prev) => ({ ...prev, page: 1 }));
      updateURL(newFilters, sortingRef.current, 1);

      if (options.type === "apply") {
        auditLogger.info("clients_filters_applied", {
          metadata: {
            status: newFilters.status,
            activityTypes: newFilters.activityTypes,
            minActivityCount: newFilters.minActivityCount,
            maxActivityCount: newFilters.maxActivityCount,
            activitySince: newFilters.activitySince,
          },
        });
      } else if (options.type === "reset") {
        auditLogger.info("clients_filters_reset", {});
      }
    },
    [debouncedSearch, filtersRef, setFilters, setPagination, sortingRef, updateURL],
  );

  const handleSort = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      const newSorting = { sortBy, sortOrder };
      setSorting(newSorting);
      sortingRef.current = newSorting;
      updateURL(filtersRef.current, newSorting, pagination.page);

      auditLogger.info("clients_sorted", {
        metadata: { sortBy, sortOrder },
      });
    },
    [filtersRef, pagination.page, setSorting, sortingRef, updateURL],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPagination((prev) => ({ ...prev, page: newPage }));
      updateURL(filtersRef.current, sortingRef.current, newPage);
    },
    [filtersRef, setPagination, sortingRef, updateURL],
  );

  return {
    clients,
    filters,
    loading,
    pagination,
    handleFilterChange,
    handleSort,
    handlePageChange,
  };
}
