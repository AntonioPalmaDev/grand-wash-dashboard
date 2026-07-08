import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useSales } from "@/features/products/useSales";
import { Client, ClientType, Operation, ProductCategory, OperationStatus } from "@/types";
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
  const { sales } = useSales();
  const [filters, setFilters] = useState<ReportFilters>({
    search: "",
    tipo: "all",
    category: "all",
    status: "all",
  });

  // Convert weapon sales into synthetic Operation entries so BI components render them.
  const salesAsOperations = useMemo<Operation[]>(() => {
    return sales.map((s) => {
      const matched = s.client_id
        ? clients.find((c) => c.id === s.client_id)
        : clients.find(
            (c) => c.nome.trim().toLowerCase() === (s.client_name_snapshot || "").trim().toLowerCase(),
          );
      return {
        id: s.id,
        clientId: matched?.id || `sale:${s.id}`,
        valorBruto: Number(s.total_sale_value) || 0,
        taxaPercentual: Number(s.real_margin) || 0,
        lucroBruto: Number(s.real_profit) || 0,
        custoMaquina: 0,
        lucroLiquido: Number(s.real_profit) || 0,
        valorCliente: Number(s.total_sale_value) || 0,
        status: s.status as OperationStatus,
        responsavel: s.created_by_name || s.created_by_email || "—",
        data: s.sale_date,
        createdAt: s.created_at,
        category: "itens" as ProductCategory,
      };
    });
  }, [sales, clients]);

  // Virtual clients for sales whose client no longer exists / never was linked.
  const clientsWithSalesFallback = useMemo<Client[]>(() => {
    const existingIds = new Set(clients.map((c) => c.id));
    const extras: Client[] = [];
    const seen = new Set<string>();
    for (const s of sales) {
      const matched = s.client_id
        ? clients.find((c) => c.id === s.client_id)
        : clients.find(
            (c) => c.nome.trim().toLowerCase() === (s.client_name_snapshot || "").trim().toLowerCase(),
          );
      if (matched) continue;
      const virtualId = `sale:${s.id}`;
      if (existingIds.has(virtualId) || seen.has(virtualId)) continue;
      seen.add(virtualId);
      extras.push({
        id: virtualId,
        nome: s.client_name_snapshot?.trim() || "Cliente não informado",
        tipo: "PF",
        taxa: 0,
        cor: "#a855f7",
        createdAt: s.created_at,
      });
    }
    return [...clients, ...extras];
  }, [clients, sales]);

  const combinedOperations = useMemo(
    () => [...operations, ...salesAsOperations],
    [operations, salesAsOperations],
  );

  const filteredOperations = useMemo(() => {
    let ops = [...combinedOperations];

    // Filter by search (client name)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      ops = ops.filter((op) => {
        const c = clientsWithSalesFallback.find((cl) => cl.id === op.clientId);
        return c?.nome.toLowerCase().includes(q);
      });
    }

    // Filter by client type
    if (filters.tipo !== "all") {
      ops = ops.filter((op) => {
        const c = clientsWithSalesFallback.find((cl) => cl.id === op.clientId);
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
  }, [combinedOperations, clientsWithSalesFallback, filters]);

  const stats = useMemo(() => calculateReportStats(filteredOperations), [filteredOperations]);

  const chartData = useMemo(() => groupOperationsByDate(filteredOperations), [filteredOperations]);

  return {
    operations: filteredOperations,
    clients: clientsWithSalesFallback,
    filters,
    setFilters,
    stats,
    chartData,
  };
}

