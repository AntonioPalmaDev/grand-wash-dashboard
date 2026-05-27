import { useApp } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { DollarSign, TrendingUp, Cpu, Wallet, Package } from "lucide-react";

export default function FinancePage() {
  const { getStats } = useApp();
  const stats = getStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Controle Financeiro</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Bruto Movimentado" value={formatCurrency(stats.totalMovimentado)} icon={DollarSign} variant="primary" description="Soma de todos os valores brutos das operações concluídas" />
        <KpiCard title="Taxa Média Aplicada" value={formatPercent(stats.taxaMedia)} icon={TrendingUp} variant="success" description="Média das taxas aplicadas nas operações" />
        <KpiCard title="Produtos Vendidos" value={String(stats.produtosVendidos)} icon={Package} variant="warning" description="Total de operações de produtos" />
        <KpiCard title="Lucro Líquido Real" value={formatCurrency(stats.lucroLiquidoTotal)} icon={Wallet} variant="primary" description="Principal métrica — lucro acumulado" />
      </div>

      <div className="glass-card rounded-lg p-6 space-y-3">
        <h2 className="text-lg font-semibold">Resumo</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Total de operações concluídas: <span className="text-foreground font-mono font-semibold">{stats.operacoesConcluidas}</span></p>
          <p>Quantidade total de itens vendidos: <span className="text-foreground font-mono font-semibold">{stats.quantidadeTotalItens}</span></p>
          {stats.totalMovimentado > 0 && (
            <p>Margem líquida: <span className="text-primary font-mono font-semibold">{((stats.lucroLiquidoTotal / stats.totalMovimentado) * 100).toFixed(1)}%</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
