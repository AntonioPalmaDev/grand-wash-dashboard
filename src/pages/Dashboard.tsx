import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
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
  const { operations, clients } = useApp();

  // Estado para os filtros e para a visualização do gráfico
  const [chartView, setChartView] = useState<"line" | "bar">("line");
  const [filtros, setFiltros] = useState({
    periodo: "30d",
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
        const d = new Date(op.data);
        return String(d.getMonth() + 1).padStart(2, "0") === filtros.mes;
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
  const kpiStats = useMemo(() => ({
    totalMovimentado: filteredOperations.reduce((s, op) => s + op.valorBruto, 0),
    lucroBrutoTotal: filteredOperations.reduce((s, op) => s + op.lucroBruto, 0),
    totalMaquina: filteredOperations.reduce((s, op) => s + op.custoMaquina, 0),
    lucroLiquidoTotal: filteredOperations.reduce((s, op) => s + op.lucroLiquido, 0),
    totalRepassado: filteredOperations.reduce((s, op) => s + op.valorCliente, 0),
    totalOperacoes: filteredOperations.length,
  }), [filteredOperations]);

  // 3. DADOS DO GRÁFICO
  const chartData = useMemo(() => {
    const result: Record<string, number> = {};
    const now = new Date();

    if (filtros.agrupamento === "dia") {
      const days = filtros.periodo === "ALL" ? 30 : Number(filtros.periodo.replace("d", ""));
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        result[d.toISOString().split("T")[0]] = 0;
      }
    }

    filteredOperations.forEach(op => {
      const d = new Date(op.data);
      let key = filtros.agrupamento === "dia" 
        ? d.toISOString().split("T")[0] 
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      
      if (filtros.agrupamento === "empresa") {
        key = clients.find(c => c.id === op.clientId)?.nome ?? "Desconhecido";
      }
      result[key] = (result[key] || 0) + op.valorBruto;
    });

    return Object.entries(result)
      .sort(([a], [b]) => (filtros.agrupamento === "empresa" ? a.localeCompare(b) : new Date(a).getTime() - new Date(b).getTime()))
      .map(([key, total]) => ({
        label: filtros.agrupamento === "dia" ? formatDate(key) : key,
        total,
      }));
  }, [filteredOperations, filtros, clients]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Alternador de visualização */}
        <Tabs value={chartView} onValueChange={(v) => setChartView(v as "line" | "bar")}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="line" className="gap-2">
              <LineChartIcon size={16} /> Linhas
            </TabsTrigger>
            <TabsTrigger value="bar" className="gap-2">
              <BarChartIcon size={16} /> Colunas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* TODOS OS FILTROS RECUPERADOS */}
      <div className="flex flex-wrap gap-3 bg-secondary/10 p-4 rounded-xl border border-white/5">
        <select className="bg-secondary p-2 rounded text-sm outline-none" value={filtros.mes} onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}>
          <option value="ALL">Todos os meses</option>
          {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
            <option key={m} value={m}>{new Date(2000, Number(m)-1).toLocaleString('pt-BR', { month: 'short' })}</option>
          ))}
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none" value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}>
          <option value="7d">7 dias</option>
          <option value="30d">30 dias</option>
          <option value="ALL">Todo o tempo</option>
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none" value={filtros.agrupamento} onChange={(e) => setFiltros({ ...filtros, agrupamento: e.target.value })}>
          <option value="dia">Por dia</option>
          <option value="mes">Por mês</option>
          <option value="empresa">Por empresa</option>
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="ALL">Todos (PF/PJ)</option>
          <option value="PJ">PJ</option>
          <option value="PF">PF</option>
        </select>

        <select className="bg-secondary p-2 rounded text-sm outline-none max-w-[200px]" value={filtros.clienteId} onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })}>
          <option value="ALL">Todos os clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* ÁREA DO GRÁFICO DINÂMICO */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" vertical={false} />
                <XAxis dataKey="label" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={formatCompact} stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: "12px" }}
                  formatter={(v: number) => [formatCurrency(v), "Total"]}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(270,70%,55%)" strokeWidth={4} dot={{ r: 4, fill: "hsl(270,70%,55%)", strokeWidth: 2, stroke: "#121212" }} animationDuration={1500} />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" vertical={false} />
                <XAxis dataKey="label" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={formatCompact} stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: "12px" }} formatter={(v: number) => [formatCurrency(v), "Total"]} />
                <Bar dataKey="total" fill="hsl(270,70%,55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPIs DINÂMICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Movimentado" value={formatCurrency(kpiStats.totalMovimentado)} icon={DollarSign} />
        <KpiCard title="Lucro Bruto" value={formatCurrency(kpiStats.lucroBrutoTotal)} icon={TrendingUp} variant="success" />
        <KpiCard title="Custo Maq." value={formatCurrency(kpiStats.totalMaquina)} icon={Cpu} variant="warning" />
        <KpiCard title="Lucro Líquido" value={formatCurrency(kpiStats.lucroLiquidoTotal)} icon={Wallet} variant="primary" />
        <KpiCard title="Repassado" value={formatCurrency(kpiStats.totalRepassado)} icon={ArrowUpRight} />
        <KpiCard title="Operações" value={String(kpiStats.totalOperacoes)} icon={BarChart3} />
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

function formatDate(d: string) {
  const [year, month, day] = d.split("-");
  return `${day}/${month}`;
}