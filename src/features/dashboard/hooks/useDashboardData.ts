import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useCompany } from "@/context/CompanyContext";
import { Operation, Client } from "@/types";

export interface DashboardFilters {
  periodo: string;
  tipoOperacao: string;
  clienteId: string;
  responsavel: string;
  perfil: string;
  status: string;
  camada: string;
}

export function useDashboardData() {
  const { operations, clients, getStats } = useApp();
  const { activeCompany } = useCompany();

  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");
  const [filtros, setFiltros] = useState<DashboardFilters>({
    periodo: "30d",
    tipoOperacao: "ALL",
    clienteId: "ALL",
    responsavel: "ALL",
    perfil: "ALL",
    status: "concluido",
    camada: "ALL",
  });

  const responsaveis = useMemo(() => {
    return Array.from(new Set(operations.map(op => op.responsavel))).filter(Boolean).sort();
  }, [operations]);

  const filteredOperations = useMemo(() => {
    let filtered = [...operations];
    const now = new Date();

    if (filtros.status !== "ALL") {
      filtered = filtered.filter(op => op.status === filtros.status);
    }

    if (filtros.periodo !== "ALL") {
      const days = Number(filtros.periodo.replace("d", ""));
      const limitDate = new Date();
      limitDate.setDate(now.getDate() - days);
      filtered = filtered.filter(op => new Date(op.data) >= limitDate);
    }

    if (filtros.camada === "FINANCEIRO") {
      filtered = filtered.filter(op => op.category === "dinheiro");
    } else if (filtros.camada === "PRODUTOS") {
      filtered = filtered.filter(op => op.category === "itens");
    }

    if (filtros.perfil !== "ALL") {
      filtered = filtered.filter(op => {
        const client = clients.find(c => c.id === op.clientId);
        return client?.tipo === filtros.perfil;
      });
    }

    if (filtros.clienteId !== "ALL") {
      filtered = filtered.filter(op => op.clientId === filtros.clienteId);
    }

    if (filtros.responsavel !== "ALL") {
      filtered = filtered.filter(op => op.responsavel === filtros.responsavel);
    }

    return filtered;
  }, [operations, filtros, clients]);

  const { stats, previousStats } = useMemo(() => {
    const current = getStats(filteredOperations);
    
    const now = new Date();
    const days = filtros.periodo === "ALL" ? 30 : Number(filtros.periodo.replace("d", ""));
    const limitDate = new Date();
    limitDate.setDate(now.getDate() - days);
    const startPreviousDate = new Date();
    startPreviousDate.setDate(limitDate.getDate() - days);

    const previousOps = operations.filter(op => {
      const opDate = new Date(op.data);
      return op.status === "concluido" && opDate >= startPreviousDate && opDate < limitDate;
    });

    const previous = getStats(previousOps);
    
    return { stats: current, previousStats: previous };
  }, [getStats, filteredOperations, operations, filtros.periodo]);

  const chartData = useMemo(() => {
    const result: Record<string, number> = {};
    const now = new Date();

    const getSPDateKey = (date: Date) => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        year: "numeric", month: "2-digit", day: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).formatToParts(date);
      const y = parts.find(p => p.type === "year")?.value;
      const m = parts.find(p => p.type === "month")?.value;
      const d = parts.find(p => p.type === "day")?.value;
      return `${y}-${m}-${d}`;
    };

    if (filtros.periodo !== "ALL") {
      const days = Number(filtros.periodo.replace("d", ""));
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        result[getSPDateKey(d)] = 0;
      }
    }

    filteredOperations.forEach(op => {
      const d = new Date(op.data);
      const key = getSPDateKey(d);
      const realValue = op.category === "dinheiro" ? op.lucroLiquido : op.valorBruto;
      result[key] = (result[key] || 0) + realValue;
    });

    return Object.entries(result)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        label: formatDayLabel(key),
        fullDate: key,
        value,
      }));
  }, [filteredOperations, filtros.periodo]);

  return {
    activeCompany,
    chartType,
    setChartType,
    filtros,
    setFiltros,
    responsaveis,
    clients,
    stats,
    previousStats,
    chartData,
  };
}

function formatDayLabel(dateKey: string) {
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}
