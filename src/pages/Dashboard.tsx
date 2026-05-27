import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDateOnly, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
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

export default function Dashboard() {
  const { operations, clients, products } = useApp();
  const { activeCompany } = useCompany();
  const isBlackDragons = activeCompany?.name === "Black Dragons";

  // Estado para os filtros e para a visualização do gráfico
  const [chartView, setChartView] = useState<"line" | "bar">("line");
  const [filtros, setFiltros] = useState({
    periodo: "ALL",
    agrupamento: "dia",
    tipo: "ALL",
    clienteId: "ALL",
    mes: "ALL",
  });

  // 1. FILTRAGEM COMPLETA (Sincroniza tudo: Cards, Gráficos e Ranking)
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

  // 2. KPIs DINÂMICOS
  const { getStats } = useApp();
  const kpiStats = useMemo(() => {
    const stats = getStats(filteredOperations);
    
    // Add product specific stats
    if (isBlackDragons) {
      const totalItens = filteredOperations.reduce((sum, op) => {
        if (op.category === 'itens' && op.items) {
          return sum + op.items.reduce((iSum, item) => iSum + item.quantity, 0);
        }
        return sum;
      }, 0);
      return { ...stats, totalItensVendidos: totalItens };
    }
    
    return stats;
  }, [getStats, filteredOperations, isBlackDragons]);

  // Produtos mais vendidos
  const topProducts = useMemo(() => {
    if (!isBlackDragons) return [];
    
    const productSales: Record<string, { name: string, quantity: number, total: number }> = {};
    
    filteredOperations.forEach(op => {
      if (op.category === 'itens' && op.items) {
        op.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { 
              name: item.product?.name || "Desconhecido", 
              quantity: 0, 
              total: 0 
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].total += item.subtotal;
        });
      }
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOperations, isBlackDragons]);

  // 3. DADOS DO GRÁFICO
  const chartData = useMemo(() => {
    const result: Record<string, number> = {};
    const now = new Date();

    // Helper: pega YYYY-MM-DD no fuso de São Paulo
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
      .sort(([a], [b]) => (filtros.agrupamento === "empresa" ? a.localeCompare(b) : a.localeCompare(b)))
      .map(([key, total]) => ({
        label: filtros.agrupamento === "dia" ? formatDayLabel(key) : key,
        total,
      }));
  }, [filteredOperations, filtros, clients]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        
        {/* Alternador de visualização */}
        <Tabs value={chartView} onValueChange={(v) => setChartView(v as "line" | "bar")} className="w-full sm:w-auto">
          <TabsList className="bg-secondary w-full sm:w-auto">
            <TabsTrigger value="line" className="gap-2 flex-1 sm:flex-none">
              <LineChartIcon size={16} /> Linhas
            </TabsTrigger>
            <TabsTrigger value="bar" className="gap-2 flex-1 sm:flex-none">
              <BarChartIcon size={16} /> Colunas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* FILTROS - grid responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 bg-secondary/10 p-3 sm:p-4 rounded-xl border border-white/5">
        <select className="bg-secondary p-2 rounded text-sm outline-none min-w-0 w-full" value={filtros.mes} onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}>
          <option value="ALL">Todos os meses</option>
          {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
            <option key={m} value={m}>{new Date(2000, Number(m)-1).toLocaleString('pt-BR', { month: 'short' })}</option>
          ))}
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none min-w-0 w-full" value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}>
          <option value="7d">7 dias</option>
          <option value="30d">30 dias</option>
          <option value="ALL">Todo o período</option>
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none min-w-0 w-full" value={filtros.agrupamento} onChange={(e) => setFiltros({ ...filtros, agrupamento: e.target.value })}>
          <option value="dia">Por dia</option>
          <option value="mes">Por mês</option>
          <option value="empresa">Por empresa</option>
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none min-w-0 w-full" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="ALL">Todos (PF/PJ)</option>
          <option value="PJ">PJ</option>
          <option value="PF">PF</option>
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none min-w-0 w-full col-span-2 sm:col-span-1" value={filtros.clienteId} onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })}>
          <option value="ALL">Todos os clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* ÁREA DO GRÁFICO DINÂMICO */}
      <div className="glass-card rounded-2xl p-3 sm:p-6 border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <div className="h-[250px] sm:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "line" ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" vertical={false} />
                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={formatCompact} stroke="#666" fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip 
                  contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: "12px" }}
                  formatter={(v: number) => [formatCurrency(v), "Total"]}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(270,70%,55%)" strokeWidth={3} dot={{ r: 3, fill: "hsl(270,70%,55%)", strokeWidth: 2, stroke: "#121212" }} animationDuration={1500} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" vertical={false} />
                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={formatCompact} stroke="#666" fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: "12px" }} formatter={(v: number) => [formatCurrency(v), "Total"]} />
                <Bar dataKey="total" fill="hsl(270,70%,55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPIs - grid responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard title={isBlackDragons ? "Vendas Totais" : "Movimentado"} value={formatCurrency(kpiStats.totalMovimentado)} icon={DollarSign} />
        <KpiCard title="Lucro Líquido" value={formatCurrency(kpiStats.lucroLiquidoTotal)} icon={Wallet} variant="primary" />
        <KpiCard 
          title="Margem" 
          value={formatPercent(kpiStats.totalMovimentado > 0 ? (kpiStats.lucroLiquidoTotal / kpiStats.totalMovimentado) * 100 : 0)} 
          icon={TrendingUp} 
          variant="success" 
        />
        {isBlackDragons ? (
          <KpiCard title="Itens Vendidos" value={String(kpiStats.totalItensVendidos || 0)} icon={Package} />
        ) : (
          <KpiCard title="Ticket Médio" value={formatCurrency(kpiStats.totalOperacoes > 0 ? kpiStats.totalMovimentado / kpiStats.totalOperacoes : 0)} icon={ArrowUpRight} />
        )}
        <KpiCard title="Operações" value={String(kpiStats.totalOperacoes)} icon={BarChart3} />
        <KpiCard 
          title="Status" 
          value="Concluído" 
          icon={Check} 
          description="Filtro ativo"
          variant="success"
        />
      </div>

      {isBlackDragons && topProducts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" /> Produtos Mais Vendidos
            </h3>
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.quantity} unidades vendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm">{formatCurrency(p.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-center items-center text-center space-y-4">
             <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Zap size={32} />
             </div>
             <div>
                <h3 className="text-xl font-bold">Fluxo Operacional Black Dragons</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                  Sistema adaptado para venda de itens e operações financeiras dinâmicas.
                </p>
             </div>
             <Button variant="outline" className="mt-4" onClick={() => window.location.href='/operacoes'}>
                Ver Operações
             </Button>
          </div>
        </div>
      )}
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