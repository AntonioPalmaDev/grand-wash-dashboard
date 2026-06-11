import React from "react";
import { ReportFilters } from "./ReportFilters";
import { ReportKpiGrid } from "./ReportKpiGrid";
import { ReportCharts } from "./ReportCharts";
import { ReportDataTable } from "./ReportDataTable";
import { useReportsData } from "../hooks/useReportsData";
import { Separator } from "@/components/ui/separator";

export function ReportsLayout() {
  const { operations, clients, filters, setFilters, stats, chartData } = useReportsData();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
          Relatórios <span className="text-primary text-xl not-italic">&</span> BI
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Análise profunda de movimentação, performance financeira e fluxos de estoque da Zero Foco.
        </p>
      </div>

      <ReportFilters filters={filters} onFilterChange={setFilters} />
      
      <div className="space-y-6">
        <ReportKpiGrid stats={stats} />
        
        <Separator className="bg-white/5" />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ReportCharts data={chartData} />
          </div>
          <div className="glass-card rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Destaques do Período
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-sm text-muted-foreground">Conversão de Sucesso</span>
                <span className="text-lg font-mono font-bold text-white">
                  {stats.count > 0 ? ((stats.completedCount / stats.count) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-sm text-muted-foreground">Ticket Médio</span>
                <span className="text-lg font-mono font-bold text-white">
                  {formatCurrency(stats.count > 0 ? stats.totalBruto / stats.count : 0)}
                </span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-sm text-muted-foreground">Eficiência Líquida</span>
                <span className="text-lg font-mono font-bold text-emerald-500">
                  {stats.totalBruto > 0 ? ((stats.lucroLiquido / stats.totalBruto) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-white/5" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Detalhamento Granular
            </h3>
            <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full uppercase">
              {operations.length} registros
            </span>
          </div>
          <ReportDataTable operations={operations} clients={clients} />
        </div>
      </div>
    </div>
  );
}

// Helper formatting locally if not available
function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}
