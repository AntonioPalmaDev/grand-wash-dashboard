import { useCompany } from "@/context/CompanyContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Check, 
  Wallet, 
  Zap, 
  ShoppingBag, 
  AlertTriangle,
  Calendar,
  User,
  Shield,
  Layers,
  History,
  Search,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  AreaChart as AreaChartIcon
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { DashboardFilters } from "@/features/dashboard/components/DashboardFilters";
import { ExecutiveKpi } from "@/features/dashboard/components/ExecutiveKpi";
import { CustomTooltip } from "@/features/dashboard/components/CustomTooltip";
import { useSales } from "@/features/products/useSales";
import { useWeaponSalesDashboardData } from "@/features/dashboard/hooks/useWeaponSalesDashboardData";


import { useModules } from "@/context/ModuleContext";

export default function Dashboard() {
  const { isModuleEnabled } = useModules();
  const showOperacoesFinanceiras = isModuleEnabled("operacoes_financeiras");
  const showOperacoesProdutos = isModuleEnabled("operacoes_produtos");
  const showProdutos = isModuleEnabled("produtos");
  const showFinanceiro = showOperacoesFinanceiras || isModuleEnabled("financeiro");

  const {
    chartType,
    setChartType,
    filtros,
    setFiltros,
    responsaveis,
    clients,
    stats,
    previousStats,
    chartData
  } = useDashboardData();
  const { stats: salesStats } = useSales();
  const {
    weaponSalesStats,
    weaponSalesChartData,
    topWeapons,
    topClients,
  } = useWeaponSalesDashboardData(filtros.periodo);

  // Merge weapon sales into main chart (by date)
  const mergedChartData = (() => {
    const map = new Map<string, { label: string; fullDate: string; value: number }>();
    chartData.forEach(p => map.set(p.fullDate, { ...p }));
    weaponSalesChartData.forEach(p => {
      const prev = map.get(p.fullDate);
      if (prev) prev.value += p.value;
      else map.set(p.fullDate, { ...p });
    });
    return Array.from(map.values()).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  })();


  const calculateGrowth = (current: number, previous: number) => {
    if (!previous) return null;
    const growth = ((current - previous) / previous) * 100;
    return {
      value: `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`,
      isPositive: growth >= 0
    };
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* HEADER & FILTROS */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              Dashboard <span className="text-primary">Executivo</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Análise de performance e receita real da plataforma.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-white/5 bg-secondary/30 backdrop-blur-md h-10 gap-2" onClick={() => window.location.href='/historico'}>
              <History size={16} /> Histórico
            </Button>
            <div className="h-10 w-[1px] bg-white/10 mx-2 hidden md:block" />
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="hidden sm:block">
              <TabsList className="bg-secondary/50 border border-white/5 h-10">
                <TabsTrigger value="area" className="data-[state=active]:bg-primary h-8"><AreaChartIcon size={16} /></TabsTrigger>
                <TabsTrigger value="line" className="data-[state=active]:bg-primary h-8"><LineChartIcon size={16} /></TabsTrigger>
                <TabsTrigger value="bar" className="data-[state=active]:bg-primary h-8"><BarChartIcon size={16} /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* MODERN FILTERS BAR */}
        <DashboardFilters 
          filtros={filtros}
          setFiltros={setFiltros}
          responsaveis={responsaveis}
          clients={clients}
        />
      </header>

      {/* MAIN CHART */}
      <section className="relative">

        <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/[0.02] to-transparent overflow-hidden rounded-[2rem] shadow-2xl backdrop-blur-sm">
          <CardContent className="p-4 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-primary h-6 w-6" /> Movimentação de Receita Real
                </h3>
                <p className="text-muted-foreground text-sm">Entrada líquida (lavagem) + faturamento bruto (vendas).</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-white/5 px-4 sm:px-6 py-3 rounded-2xl border border-white/5 w-full md:w-auto">
                <div className="text-center flex-1 md:flex-none">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Período</p>
                  <p className="text-lg sm:text-xl font-mono font-bold text-emerald-500 tracking-tighter">
                    {formatCurrency(chartData.reduce((acc, curr) => acc + curr.value, 0))}
                  </p>
                </div>
                <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
                <div className="text-center flex-1 md:flex-none">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Média Diária</p>
                  <p className="text-lg sm:text-xl font-mono font-bold text-emerald-500 tracking-tighter">
                    {formatCurrency(chartData.length ? chartData.reduce((acc, curr) => acc + curr.value, 0) / chartData.length : 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[300px] sm:h-[450px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(199,89%,48%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#444" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={15}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                    />
                    <YAxis 
                      tickFormatter={formatCompact} 
                      stroke="#444" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      width={45} 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(199,89%,48%)" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                ) : chartType === "line" ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#444" fontSize={11} tickLine={false} axisLine={false} dy={15} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }} />
                    <YAxis tickFormatter={formatCompact} stroke="#444" fontSize={11} tickLine={false} axisLine={false} width={45} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(199,89%,48%)" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: "#0ea5e9", strokeWidth: 3, stroke: "#000" }} 
                      activeDot={{ r: 8, strokeWidth: 0, fill: "#fff" }} 
                      animationDuration={1500}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#444" fontSize={11} tickLine={false} axisLine={false} dy={15} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }} />
                    <YAxis tickFormatter={formatCompact} stroke="#444" fontSize={11} tickLine={false} axisLine={false} width={45} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="value" fill="hsl(199,89%,48%)" radius={[8, 8, 0, 0]} animationDuration={1500} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>


      {/* KPI SUMMARIZED */}
      <div className="space-y-8">
        {showOperacoesFinanceiras && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-1">
            <DollarSign className="h-4 w-4" /> Performance Financeira
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ExecutiveKpi 
              title="Receita Real (Líquida)" 
              value={formatCurrency(stats.lucroLiquidoTotal)} 
              icon={Wallet} 
              trend={calculateGrowth(stats.lucroLiquidoTotal, previousStats.lucroLiquidoTotal)} 
              color="emerald"
            />
            <ExecutiveKpi 
              title="Taxa Média Aplicada" 
              value={formatPercent(stats.taxaMedia)} 
              icon={Zap} 
              color="blue"
            />
            <ExecutiveKpi 
              title="Volume Bruto Lavado" 
              value={formatCurrency(stats.totalMovimentado)} 
              icon={TrendingUp} 
              trend={calculateGrowth(stats.totalMovimentado, previousStats.totalMovimentado)}
              color="purple"
            />
            <ExecutiveKpi 
              title="Operações Financeiras" 
              value={String(stats.operacoesConcluidas)} 
              icon={Check} 
              color="indigo"
            />
          </div>
        </div>
        )}

        {(showProdutos || showOperacoesProdutos) && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-1">
            <Package className="h-4 w-4" /> Gestão de Produtos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ExecutiveKpi 
              title="Faturamento Vendas" 
              value={formatCurrency(stats.faturamentoProdutos)} 
              icon={ShoppingBag} 
              trend={calculateGrowth(stats.faturamentoProdutos, previousStats.faturamentoProdutos)} 
              color="amber"
            />
            <ExecutiveKpi 
              title="Itens Vendidos" 
              value={String(stats.quantidadeTotalItens)} 
              icon={Package} 
              color="cyan"
            />
            <ExecutiveKpi 
              title="Vendas Concluídas" 
              value={String(stats.produtosVendidos)} 
              icon={Check} 
              color="teal"
            />
          </div>
        </div>
        )}

        {(showProdutos || showOperacoesProdutos) && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-1">
            <ShoppingBag className="h-4 w-4" /> Vendas (Armas & Produtos)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ExecutiveKpi title="Total Vendido" value={formatCurrency(salesStats.totalVendido)} icon={ShoppingBag} color="emerald" />
            <ExecutiveKpi title="Lucro Real" value={formatCurrency(salesStats.lucroReal)} icon={TrendingUp} color="teal" />
            <ExecutiveKpi title="Ticket Médio" value={formatCurrency(salesStats.ticketMedio)} icon={Wallet} color="blue" />
            <ExecutiveKpi title="Margem Média" value={formatPercent(salesStats.margemMedia)} icon={Zap} color="purple" />
            <ExecutiveKpi title="Vendas Concluídas" value={String(salesStats.concluidas)} icon={Check} color="emerald" />
            <ExecutiveKpi title="Vendas Pendentes" value={String(salesStats.pendentes)} icon={AlertTriangle} color="amber" />
            <ExecutiveKpi title="Vendas Canceladas" value={String(salesStats.canceladas)} icon={AlertTriangle} color="indigo" />
            <ExecutiveKpi title="Total de Vendas" value={String(salesStats.total)} icon={Layers} color="cyan" />
          </div>
        </div>
        )}

        {!showOperacoesFinanceiras && !showProdutos && !showOperacoesProdutos && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum módulo ativo para exibir nesta seção.
          </p>
        )}
      </div>

      {/* SEÇÃO SECUNDÁRIA (CARDS E INSIGHTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-6 sm:p-8 border border-white/5 bg-secondary/10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-xl flex items-center gap-3 text-white tracking-tight">
              <TrendingUp className="text-primary h-6 w-6" /> Top Produtos
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.produtosMaisVendidos.length > 0 ? stats.produtosMaisVendidos.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-white tracking-tight text-sm sm:text-base">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{p.quantity} unidades</p>
                  </div>
                </div>
                <div className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter hidden sm:block">
                  Destaque
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-20">
                <Package size={64} className="mb-4" />
                <p className="font-bold uppercase tracking-widest text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6 sm:p-8 border border-white/5 bg-secondary/10 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-white tracking-tight">
              <Shield className="text-primary h-6 w-6" /> Insights
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1.5 h-auto rounded-full bg-primary/50" />
                <div>
                  <p className="text-white font-bold text-sm">Eficiência Operacional</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Sua taxa média está em <span className="text-primary font-bold">{formatPercent(stats.taxaMedia)}</span>.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1.5 h-auto rounded-full bg-emerald-500/50" />
                <div>
                  <p className="text-white font-bold text-sm">Crescimento</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Operações de produtos representam <span className="text-emerald-500 font-bold">{formatPercent((stats.faturamentoProdutos / (stats.lucroLiquidoTotal + stats.faturamentoProdutos + 0.1)) * 100)}</span> da receita.</p>
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full mt-8 border-white/5 hover:bg-white/5 text-xs uppercase font-black tracking-widest h-12 rounded-xl" onClick={() => window.location.href='/operacoes-produtos'}>
            Acessar Gestão
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helpers
function formatCompact(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return v.toString();
}
