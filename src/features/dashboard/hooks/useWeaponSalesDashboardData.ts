import { useMemo } from "react";
import { useSales, Sale } from "@/features/products/useSales";

export interface WeaponSalesStats {
  totalVendasArmas: number;
  lucroRealArmas: number;
  custoPecasArmas: number;
  quantidadeVendasArmas: number;
  ticketMedioArmas: number;
  margemMediaArmas: number;
}

export interface TopWeapon {
  name: string;
  quantity: number;
  totalValue: number;
  totalProfit: number;
}

export interface TopClient {
  name: string;
  totalSpent: number;
  salesCount: number;
  profitGenerated: number;
}

export interface WeaponSalesChartPoint {
  label: string;
  fullDate: string;
  value: number;
}

function getSPDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);
  const y = parts.find(p => p.type === "year")?.value;
  const m = parts.find(p => p.type === "month")?.value;
  const d = parts.find(p => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function formatDayLabel(dateKey: string) {
  const [, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}

export function useWeaponSalesDashboardData(periodo: string = "30d") {
  const { sales, loading } = useSales();

  const concludedSales = useMemo(
    () => sales.filter(s => s.status === "concluido" && !s.deleted_at),
    [sales]
  );

  const weaponSalesStats: WeaponSalesStats = useMemo(() => {
    const totalVendasArmas = concludedSales.reduce((a, s) => a + Number(s.total_sale_value || 0), 0);
    const lucroRealArmas = concludedSales.reduce((a, s) => a + Number(s.real_profit || 0), 0);
    const custoPecasArmas = concludedSales.reduce((a, s) => a + Number(s.total_parts_cost || 0), 0);
    const quantidadeVendasArmas = concludedSales.length;
    const ticketMedioArmas = quantidadeVendasArmas ? totalVendasArmas / quantidadeVendasArmas : 0;
    const margemMediaArmas = totalVendasArmas > 0 ? (lucroRealArmas / totalVendasArmas) * 100 : 0;
    return {
      totalVendasArmas,
      lucroRealArmas,
      custoPecasArmas,
      quantidadeVendasArmas,
      ticketMedioArmas,
      margemMediaArmas,
    };
  }, [concludedSales]);

  const topWeapons: TopWeapon[] = useMemo(() => {
    const map = new Map<string, TopWeapon>();
    concludedSales.forEach(sale => {
      (sale.sale_items || []).forEach(item => {
        const name = item.product_name_snapshot || "Sem nome";
        const prev = map.get(name) || { name, quantity: 0, totalValue: 0, totalProfit: 0 };
        prev.quantity += Number(item.quantity || 0);
        prev.totalValue += Number(item.total_sale_price || 0);
        prev.totalProfit += Number(item.real_profit || 0);
        map.set(name, prev);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [concludedSales]);

  const topClients: TopClient[] = useMemo(() => {
    const map = new Map<string, TopClient>();
    concludedSales.forEach(sale => {
      const name = sale.client_name_snapshot || "Sem cliente";
      const prev = map.get(name) || { name, totalSpent: 0, salesCount: 0, profitGenerated: 0 };
      prev.totalSpent += Number(sale.total_sale_value || 0);
      prev.salesCount += 1;
      prev.profitGenerated += Number(sale.real_profit || 0);
      map.set(name, prev);
    });
    return Array.from(map.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [concludedSales]);

  const weaponSalesChartData: WeaponSalesChartPoint[] = useMemo(() => {
    const result: Record<string, number> = {};
    const now = new Date();

    if (periodo !== "ALL") {
      const days = Number(periodo.replace("d", "")) || 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        result[getSPDateKey(d)] = 0;
      }
    }

    concludedSales.forEach(sale => {
      const d = new Date(sale.sale_date || sale.created_at);
      const key = getSPDateKey(d);
      if (periodo === "ALL" || key in result) {
        result[key] = (result[key] || 0) + Number(sale.total_sale_value || 0);
      }
    });

    return Object.entries(result)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        label: formatDayLabel(key),
        fullDate: key,
        value,
      }));
  }, [concludedSales, periodo]);

  return {
    loading,
    concludedSales,
    weaponSalesStats,
    weaponSalesChartData,
    topWeapons,
    topClients,
  };
}
