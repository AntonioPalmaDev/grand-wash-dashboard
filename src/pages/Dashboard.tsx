import { useApp } from "@/context/AppContext";
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
  ArrowUpRight,
  ArrowDownRight,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  AreaChart as AreaChartIcon,
  History,
  Filter,
  Search
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
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { operations, clients, getStats } = useApp();
  const { activeCompany } = useCompany();

  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");
  const [filtros, setFiltros] = useState({
    periodo: "30d",
    tipoOperacao: "ALL",
    clienteId: "ALL",
    responsavel: "ALL",
    perfil: "ALL",
    status: "concluido",
    camada: "ALL", // "FINANCEIRO" | "PRODUTOS" | "ALL"
  });

  // Unique lists for filters
  const responsaveis = useMemo(() => {
    return Array.from(new Set(operations.map(op => op.responsavel))).filter(Boolean).sort();
  }, [operations]);

  const filteredOperations = useMemo(() => {
    let filtered = [...operations];
    const now = new Date();

    // Filtro de Status
    if (filtros.status !== "ALL") {
      filtered = filtered.filter(op => op.status === filtros.status);
    }

    // Filtro de Período
    if (filtros.periodo !== "ALL") {
      const days = Number(filtros.periodo.replace("d", ""));
      const limitDate = new Date();
      limitDate.setDate(now.getDate() - days);
      filtered = filtered.filter(op => new Date(op.data) >= limitDate);
    }

    // Filtro de Camada (Financeiro / Produtos)
    if (filtros.camada === "FINANCEIRO") {
      filtered = filtered.filter(op => op.category === "dinheiro");
    } else if (filtros.camada === "PRODUTOS") {
      filtered = filtered.filter(op => op.category === "itens");
    }

    // Filtro de Perfil (PF/PJ)
    if (filtros.perfil !== "ALL") {
      filtered = filtered.filter(op => {
        const client = clients.find(c => c.id === op.clientId);
        return client?.tipo === filtros.perfil;
      });
    }

    // Filtro de Cliente
    if (filtros.clienteId !== "ALL") {
      filtered = filtered.filter(op => op.clientId === filtros.clienteId);
    }

    // Filtro de Responsável
    if (filtros.responsavel !== "ALL") {
      filtered = filtered.filter(op => op.responsavel === filtros.responsavel);
    }

    return filtered;
  }, [operations, filtros, clients]);

  const { stats, previousStats } = useMemo(() => {
    const current = getStats(filteredOperations);
    
    // Calculate previous period for comparison
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

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous) return null;
    const growth = ((current - previous) / previous) * 100;
    return {
      value: `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`,
      isPositive: growth >= 0
    };
  };

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

    // Pre-fill days for 7d/30d
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
      
      // LOGIC: REAL ENTRY
      // Money -> Lucro Líquido
      // Items -> Valor Bruto
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* HEADER & FILTROS */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
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
        <div className="p-1.5 bg-secondary/10 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <FilterItem 
              icon={Calendar} 
              label="Período" 
              value={filtros.periodo} 
              onChange={(v) => setFiltros(f => ({ ...f, periodo: v }))}
              options={[
                { label: "7 Dias", value: "7d" },
                { label: "30 Dias", value: "30d" },
                { label: "Total", value: "ALL" },
              ]}
            />
            <FilterItem 
              icon={Layers} 
              label="Camada" 
              value={filtros.camada} 
              onChange={(v) => setFiltros(f => ({ ...f, camada: v }))}
              options={[
                { label: "Ambas", value: "ALL" },
                { label: "Financeiro", value: "FINANCEIRO" },
                { label: "Produtos", value: "PRODUTOS" },
              ]}
            />
            <FilterItem 
              icon={Shield} 
              label="Perfil" 
              value={filtros.perfil} 
              onChange={(v) => setFiltros(f => ({ ...f, perfil: v }))}
              options={[
                { label: "Todos", value: "ALL" },
                { label: "PJ", value: "PJ" },
                { label: "PF", value: "PF" },
              ]}
            />
            <FilterItem 
              icon={User} 
              label="Responsável" 
              value={filtros.responsavel} 
              onChange={(v) => setFiltros(f => ({ ...f, responsavel: v }))}
              options={[
                { label: "Todos", value: "ALL" },
                ...responsaveis.map(r => ({ label: r, value: r }))
              ]}
            />
            <FilterItem 
              icon={Search} 
              label="Cliente" 
              value={filtros.clienteId} 
              onChange={(v) => setFiltros(f => ({ ...f, clienteId: v }))}
              options={[
                { label: "Todos Clientes", value: "ALL" },
                ...clients.map(c => ({ label: c.nome, value: c.id }))
              ]}
            />
            <FilterItem 
              icon={Zap} 
              label="Status" 
              value={filtros.status} 
              onChange={(v) => setFiltros(f => ({ ...f, status: v }))}
              options={[
                { label: "Todos", value: "ALL" },
                { label: "Concluído", value: "concluido" },
                { label: "Pendente", value: "pendente" },
                { label: "Cancelado", value: "cancelado" },
              ]}
            />
          </div>
        </div>
      </header>

      {/* MAIN CHART (PRIORIDADE MÁXIMA) */}
      <section className="relative">
        <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/[0.02] to-transparent overflow-hidden rounded-[2rem] shadow-2xl backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-primary h-6 w-6" /> Movimentação de Receita Real
                </h3>
                <p className="text-muted-foreground text-sm">Entrada líquida (lavagem) + faturamento bruto (vendas).</p>
              </div>
              
              <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Período</p>
                  <p className="text-xl font-mono font-bold text-white tracking-tighter">
                    {formatCurrency(chartData.reduce((acc, curr) => acc + curr.value, 0))}
                  </p>
                </div>
                <div className="w-[1px] h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Média Diária</p>
                  <p className="text-xl font-mono font-bold text-primary tracking-tighter">
                    {formatCurrency(chartData.length ? chartData.reduce((acc, curr) => acc + curr.value, 0) / chartData.length : 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[450px] w-full mt-4">
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

      {/* KPI SUMMARIZED (ABAIXO DO GRÁFICO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camada Financeira */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-1">
            <DollarSign className="h-4 w-4" /> Performance Financeira
          </h2>
          <div className="grid grid-cols-2 gap-4">
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

        {/* Camada Produtos */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-1">
            <Package className="h-4 w-4" /> Gestão de Produtos
          </h2>
          <div className="grid grid-cols-2 gap-4">
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
              title="Estoque Baixo" 
              value={String(stats.estoqueBaixoCount)} 
              icon={AlertTriangle} 
              color="rose"
              critical={stats.estoqueBaixoCount > 0}
            />
            <ExecutiveKpi 
              title="Vendas Concluídas" 
              value={String(stats.produtosVendidos)} 
              icon={Check} 
              color="teal"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO SECUNDÁRIA (CARDS E INSIGHTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8 border border-white/5 bg-secondary/10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-xl flex items-center gap-3 text-white tracking-tight">
              <TrendingUp className="text-primary h-6 w-6" /> Top Produtos (Destaque Operacional)
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
                    <p className="font-bold text-white tracking-tight">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{p.quantity} unidades vendidas</p>
                  </div>
                </div>
                <div className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  Destaque
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-20">
                <Package size={64} className="mb-4" />
                <p className="font-bold uppercase tracking-widest text-sm">Nenhum dado de venda disponível</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 border border-white/5 bg-secondary/10 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-white tracking-tight">
              <Shield className="text-primary h-6 w-6" /> Insights Executivos
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1.5 h-auto rounded-full bg-primary/50" />
                <div>
                  <p className="text-white font-bold text-sm">Eficiência Operacional</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Sua taxa média está em <span className="text-primary font-bold">{formatPercent(stats.taxaMedia)}</span>, mantendo-se estável nos últimos 30 dias.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1.5 h-auto rounded-full bg-emerald-500/50" />
                <div>
                  <p className="text-white font-bold text-sm">Crescimento de Receita</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">As operações de produtos agora representam <span className="text-emerald-500 font-bold">{formatPercent((stats.faturamentoProdutos / (stats.lucroLiquidoTotal + stats.faturamentoProdutos + 0.1)) * 100)}</span> da receita real total.</p>
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="w-full mt-8 border-white/5 hover:bg-white/5 text-xs uppercase font-black tracking-widest h-12 rounded-xl" onClick={() => window.location.href='/operacoes-produtos'}>
            Acessar Gestão de Estoque
          </Button>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES

function FilterItem({ icon: Icon, label, value, options, onChange }: any) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
        <Icon size={14} className="text-primary" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground leading-none mb-1">{label}</span>
          <select 
            className="bg-transparent border-none p-0 text-xs font-bold text-white outline-none cursor-pointer appearance-none min-w-[80px]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value} className="bg-black text-white">{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function ExecutiveKpi({ title, value, icon: Icon, trend, color, critical }: any) {
  const colorMap: any = {
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    teal: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  };

  return (
    <div className={cn(
      "p-5 rounded-[1.5rem] border bg-secondary/5 backdrop-blur-sm transition-all hover:bg-secondary/10 group",
      critical ? "border-rose-500/50 bg-rose-500/5 animate-pulse" : "border-white/5"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl border", colorMap[color] || "text-primary bg-primary/10 border-primary/20")}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
            <ArrowUpRight size={10} /> {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-white/60 transition-colors">{title}</p>
        <p className="text-2xl font-mono font-black text-white tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2">{label}</p>
        <p className="text-xl font-mono font-black text-primary tracking-tighter">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Receita Real Consolidada</p>
      </div>
    );
  }
  return null;
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
