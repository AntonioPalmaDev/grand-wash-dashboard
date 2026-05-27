import { useApp } from "@/context/AppContext";
import { useCompany } from "@/context/CompanyContext";
import { formatCurrency, formatDateOnly, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Cpu,
  Wallet,
  ArrowUpRight,
  BarChart3,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  Check,
  Package,
  Zap,
  ShoppingBag,
  AlertTriangle,
  History
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { operations, clients, products, getStats } = useApp();
  const { activeCompany } = useCompany();
  const isBlackDragons = activeCompany?.name === "Black Dragons";

  const [chartView, setChartView] = useState<"line" | "bar">("line");
  const [filtros, setFiltros] = useState({
    periodo: "ALL",
    agrupamento: "dia",
    tipo: "ALL",
    clienteId: "ALL",
    mes: "ALL",
  });

  const filteredOperations = useMemo(() => {
    let filtered = operations.filter(op => op.status === "concluido");
    const now = new Date();

    if (filtros.mes !== "ALL") {
      filtered = filtered.filter(op => {
        const month = new Intl.DateTimeFormat("en-CA", {
          month: "2-digit", timeZone: "America/Sao_Paulo",
        }).format(new Date(op.data));
        return month === filtros.mes;
      });
    } else if (filtros.periodo !== "ALL") {
      const days = Number(filtros.periodo.replace("d", ""));
      const limitDate = new Date();
      limitDate.setDate(now.getDate() - days);
      filtered = filtered.filter(op => new Date(op.data) >= limitDate);
    }

    if (filtros.tipo !== "ALL") {
      filtered = filtered.filter(op => {
        const client = clients.find(c => c.id === op.clientId);
        return client?.tipo?.toUpperCase() === filtros.tipo;
      });
    }

    if (filtros.clienteId !== "ALL") {
      filtered = filtered.filter(op => op.clientId === filtros.clienteId);
    }

    return filtered;
  }, [operations, filtros, clients]);

  const kpiStats = useMemo(() => {
    return getStats(filteredOperations);
  }, [getStats, filteredOperations]);

  const topProducts = useMemo(() => {
    return kpiStats.produtosMaisVendidos;
  }, [kpiStats]);

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

    const getSPMonthKey = (date: Date) => {
      const key = getSPDateKey(date);
      return key.substring(0, 7);
    };

    if (filtros.agrupamento === "dia") {
      const days = filtros.periodo === "ALL" ? 30 : Number(filtros.periodo.replace("d", ""));
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        result[getSPDateKey(d)] = 0;
      }
    }

    filteredOperations.forEach(op => {
      const d = new Date(op.data);
      let key = filtros.agrupamento === "dia"
        ? getSPDateKey(d)
        : getSPMonthKey(d);

      if (filtros.agrupamento === "empresa") {
        key = clients.find(c => c.id === op.clientId)?.nome ?? "Desconhecido";
      }
      result[key] = (result[key] || 0) + op.valorBruto;
    });

    return Object.entries(result)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({
        label: filtros.agrupamento === "dia" ? formatDayLabel(key) : key,
        total,
      }));
  }, [filteredOperations, filtros, clients]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral da performance operacional e financeira.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs value={chartView} onValueChange={(v) => setChartView(v as "line" | "bar")} className="hidden sm:block">
            <TabsList className="bg-secondary/50 border border-white/5">
              <TabsTrigger value="line" className="gap-2"><LineChartIcon size={14} /> Linhas</TabsTrigger>
              <TabsTrigger value="bar" className="gap-2"><BarChartIcon size={14} /> Colunas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-secondary/20 rounded-2xl border border-white/5 backdrop-blur-sm">
        <select className="bg-background/50 border border-white/10 p-2 rounded-lg text-xs font-semibold outline-none w-full" value={filtros.mes} onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}>
          <option value="ALL">Meses: Todos</option>
          {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
            <option key={m} value={m}>{new Date(2000, Number(m)-1).toLocaleString('pt-BR', { month: 'long' })}</option>
          ))}
        </select>

        <select className="bg-background/50 border border-white/10 p-2 rounded-lg text-xs font-semibold outline-none w-full" value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="ALL">Período Total</option>
        </select>

        <select className="bg-background/50 border border-white/10 p-2 rounded-lg text-xs font-semibold outline-none w-full" value={filtros.agrupamento} onChange={(e) => setFiltros({ ...filtros, agrupamento: e.target.value })}>
          <option value="dia">Visão por Dia</option>
          <option value="mes">Visão por Mês</option>
          <option value="empresa">Visão por Empresa</option>
        </select>

        <select className="bg-background/50 border border-white/10 p-2 rounded-lg text-xs font-semibold outline-none w-full" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="ALL">Perfil: Todos</option>
          <option value="PJ">Perfil: PJ</option>
          <option value="PF">Perfil: PF</option>
        </select>

        <select className="bg-background/50 border border-white/10 p-2 rounded-lg text-xs font-semibold outline-none w-full col-span-2 sm:col-span-1" value={filtros.clienteId} onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })}>
          <option value="ALL">Clientes: Todos</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* MÉTRICAS FINANCEIRAS */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Performance Financeira
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total Movimentado" value={formatCurrency(kpiStats.totalMovimentado)} icon={DollarSign} variant="primary" />
          <KpiCard title="Lucro Líquido" value={formatCurrency(kpiStats.lucroLiquidoTotal)} icon={Wallet} variant="success" />
          <KpiCard title="Taxa Média" value={formatPercent(kpiStats.taxaMedia)} icon={Zap} variant="primary" />
          <KpiCard title="Operações Concluídas" value={String(kpiStats.operacoesConcluidas)} icon={Check} variant="secondary" />
        </div>
      </section>

      {/* MÉTRICAS DE PRODUTOS */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2">
          <Package className="h-4 w-4" /> Operações de Produtos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Produtos Vendidos" value={String(kpiStats.produtosVendidos)} icon={ShoppingBag} variant="secondary" />
          <KpiCard title="Quantidade Total" value={String(kpiStats.quantidadeTotalItens)} icon={Package} variant="primary" />
          <KpiCard title="Estoque Baixo" value={String(kpiStats.estoqueBaixoCount)} icon={AlertTriangle} variant="destructive" />
          <KpiCard title="Ticket Médio" value={formatCurrency(kpiStats.operacoesConcluidas > 0 ? kpiStats.totalMovimentado / kpiStats.operacoesConcluidas : 0)} icon={ArrowUpRight} variant="secondary" />
        </div>
      </section>

      {/* GRÁFICO E PRODUTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-white/5 to-transparent flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-primary" /> Tendência de Movimentação
            </h3>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-white/5 px-2 py-1 rounded">Volume Bruto</div>
          </div>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "line" ? (
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,15%)" vertical={false} />
                  <XAxis dataKey="label" stroke="#444" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tickFormatter={formatCompact} stroke="#444" fontSize={10} tickLine={false} axisLine={false} width={45} />
                  <Tooltip 
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                    formatter={(v: number) => [formatCurrency(v), "Faturamento"]}
                  />
                  <Line type="monotone" dataKey="total" stroke="hsl(199,89%,48%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(199,89%,48%)", strokeWidth: 2, stroke: "#000" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,15%)" vertical={false} />
                  <XAxis dataKey="label" stroke="#444" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tickFormatter={formatCompact} stroke="#444" fontSize={10} tickLine={false} axisLine={false} width={45} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: "12px" }} formatter={(v: number) => [formatCurrency(v), "Faturamento"]} />
                  <Bar dataKey="total" fill="hsl(199,89%,48%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-white/5 to-transparent flex flex-col shadow-2xl">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
            <TrendingUp className="text-success h-5 w-5" /> Itens de Destaque
          </h3>
          <div className="space-y-3 flex-1">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px] group-hover:bg-primary group-hover:text-white transition-all">
                    0{i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{p.quantity} unidades</p>
                  </div>
                </div>
                <div className="bg-success/10 text-success text-[10px] font-bold px-2 py-1 rounded">Top Seller</div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
                <Package size={48} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Sem dados</p>
              </div>
            )}
          </div>
          <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground hover:text-white" onClick={() => window.location.href='/operacoes-produtos'}>
            <History className="mr-2 h-3 w-3" /> Ver histórico completo
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helpers
function formatCompact(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toString();
}

function formatDayLabel(d: string) {
  const [, month, day] = d.split("-");
  return `${day}/${month}`;
}
