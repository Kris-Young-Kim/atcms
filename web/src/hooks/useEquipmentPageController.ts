"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReadonlyURLSearchParams } from "next/navigation";

import { debounce } from "@/lib/utils/debounce";
import type { Equipment } from "@/lib/validations/equipment";
import type { EquipmentStatus } from "@/lib/validations/equipment";

type StatusChangeRequest = {
  equipmentId: string;
  nextStatus: EquipmentStatus;
};

interface UseEquipmentPageControllerParams {
  router: AppRouterInstance;
  searchParams: ReadonlyURLSearchParams;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface UseEquipmentPageControllerReturn {
  equipment: Equipment[];
  loading: boolean;
  statusFilter: string;
  categoryFilter: string;
  searchQuery: string;
  statusChangeRequest: StatusChangeRequest | null;
  statusUpdating: boolean;
  handleStatusFilterSelect: (value: string) => void;
  handleCategoryFilterSelect: (value: string) => void;
  handleSearchInput: (value: string) => void;
  requestStatusChange: (equipmentId: string, newStatus: EquipmentStatus) => void;
  confirmStatusChange: () => Promise<void>;
  cancelStatusChange: () => void;
  navigateToQuantityAdjust: (equipmentId: string) => void;
}

export function useEquipmentPageController({
  router,
  searchParams,
  onSuccess,
  onError,
}: UseEquipmentPageControllerParams): UseEquipmentPageControllerReturn {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get("category") || "all",
  );
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const [statusChangeRequest, setStatusChangeRequest] = useState<StatusChangeRequest | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const syncURL = useCallback(
    (nextStatus: string, nextCategory: string, nextSearch: string) => {
      const params = new URLSearchParams();
      if (nextStatus !== "all") params.set("status", nextStatus);
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (nextSearch) params.set("search", nextSearch);

      const queryString = params.toString();
      router.replace(queryString ? `/equipment?${queryString}` : "/equipment", { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    syncURL(statusFilter, categoryFilter, searchQuery);
  }, [categoryFilter, searchQuery, statusFilter, syncURL]);

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/equipment?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data || []);
      } else {
        onError("기기 목록을 불러올 수 없습니다.");
      }
    } catch {
      onError("기기 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, onError, searchQuery, statusFilter]);

  useEffect(() => {
    void fetchEquipment();
  }, [fetchEquipment]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
      }, 300),
    [],
  );

  const handleStatusFilterSelect = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleCategoryFilterSelect = useCallback((value: string) => {
    setCategoryFilter(value);
  }, []);

  const handleSearchInput = useCallback(
    (value: string) => {
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const requestStatusChange = useCallback((equipmentId: string, newStatus: EquipmentStatus) => {
    setStatusChangeRequest({ equipmentId, nextStatus: newStatus });
  }, []);

  const cancelStatusChange = useCallback(() => {
    setStatusChangeRequest(null);
  }, []);

  const confirmStatusChange = useCallback(async () => {
    if (!statusChangeRequest) {
      return;
    }

    setStatusUpdating(true);
    try {
      const response = await fetch(`/api/equipment/${statusChangeRequest.equipmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: statusChangeRequest.nextStatus }),
      });

      if (response.ok) {
        onSuccess("기기 상태가 변경되었습니다.");
        await fetchEquipment();
      } else {
        const errorData = await response.json();
        onError(errorData.error || "기기 상태 변경에 실패했습니다.");
      }
    } catch {
      onError("기기 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setStatusUpdating(false);
      setStatusChangeRequest(null);
    }
  }, [fetchEquipment, onError, onSuccess, statusChangeRequest]);

  const navigateToQuantityAdjust = useCallback(
    (equipmentId: string) => {
      router.push(`/equipment/${equipmentId}/quantity`);
    },
    [router],
  );

  return {
    equipment,
    loading,
    statusFilter,
    categoryFilter,
    searchQuery,
    statusChangeRequest,
    statusUpdating,
    handleStatusFilterSelect,
    handleCategoryFilterSelect,
    handleSearchInput,
    requestStatusChange,
    confirmStatusChange,
    cancelStatusChange,
    navigateToQuantityAdjust,
  };
}
