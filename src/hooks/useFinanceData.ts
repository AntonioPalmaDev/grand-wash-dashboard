import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export function useFinanceData() {
  const { getStats } = useApp();
  const stats = useMemo(() => getStats(), [getStats]);

  const margemLiquida = useMemo(() => {
    if (stats.totalMovimentado > 0) {
      return ((stats.lucroLiquidoTotal / stats.totalMovimentado) * 100).toFixed(1);
    }
    return "0.0";
  }, [stats.lucroLiquidoTotal, stats.totalMovimentado]);

  return {
    stats,
    margemLiquida,
  };
}
