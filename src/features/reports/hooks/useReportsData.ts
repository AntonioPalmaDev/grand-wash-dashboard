import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { ClientType, ProductCategory, OperationStatus } from "@/types";
import { calculateReportStats, groupOperationsByDate } from "../utils/reportCalculations";

export interface ReportFilters {
  search: string;
  tipo: "all" | ClientType;
  category: "all" | ProductCategory;
  status: "all" | OperationStatus;
  startDate?: Date;
  endDate?: Date;
}

export function useReportsData() {
  const { operations, clients } = useApp();
  const [filters, setFilters] = useState<ReportFilters>({
    search: "",
    tipo: "all",
    category: "all",
    status: "all",
  });

  const filteredOperations = useMemo(() => {
    let ops = [...operations];

    // Filter by search (client name)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      ops = ops.filter((op) => {
        const c = clients.find((cl) => cl.id === op.clientId);
        return c?.nome.toLowerCase().includes(q);
      });
    }

    // Filter by client type
    if (filters.tipo !== "all") {
      ops = ops.filter((op) => {
        const c = clients.find((cl) => cl.id === op.clientId);
        return c?.tipo === filters.tipo;
      });
    }

    // Filter by category
    if (filters.category !== "all") {
      ops = ops.filter((op) => op.category === filters.category);
    }

    // Filter by status
    if (filters.status !== "all") {
      ops = ops.filter((op) => op.status === filters.status);
    }

    // Filter by date range
    if (filters.startDate) {
      ops = ops.filter((op) => new Date(op.data) >= filters.startDate!);
    }
    if (filters.endDate) {
      ops = ops.filter((op) => new Date(op.data) <= filters.endDate!);
    }

    // Sort by date descending
    return ops.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [operations, clients, filters]);

  const stats = useMemo(() => calculateReportStats(filteredOperations), [filteredOperations]);

  const chartData = useMemo(() => groupOperationsByDate(filteredOperations), [filteredOperations]);

  return {
    operations: filteredOperations,
    clients,
    filters,
    setFilters,
    stats,
    chartData,
  };
}
