import { KpiCard } from "@/components/KpiCard";
import { formatCurrency } from "@/lib/format";
import { DollarSign, Wallet, CheckCircle2, List } from "lucide-react";

interface ReportKpiGridProps {
  stats: {
    totalBruto: number;
    lucroLiquido: number;
    count: number;
    completedCount: number;
  };
}

export function ReportKpiGrid({ stats }: ReportKpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Total Bruto"
        value={formatCurrency(stats.totalBruto)}
        icon={DollarSign}
        variant="primary"
        description="Volume total"
      />
      <KpiCard
        title="Lucro Líquido"
        value={formatCurrency(stats.lucroLiquido)}
        icon={Wallet}
        variant="success"
        description="Resultado real"
      />
      <KpiCard
        title="Operações"
        value={String(stats.count)}
        icon={List}
        variant="default"
        description="Quantidade total"
      />
      <KpiCard
        title="Concluídas"
        value={String(stats.completedCount)}
        icon={CheckCircle2}
        variant="success"
        description="Sucesso"
      />
    </div>
  );
}
