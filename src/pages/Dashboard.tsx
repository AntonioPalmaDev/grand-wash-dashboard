import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { DollarSign, TrendingUp, Cpu, Wallet, ArrowUpRight, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo, useState } from "react";

export default function Dashboard() {
  const { getStats, operations, clients } = useApp();
  const stats = getStats();

  const [filtros, setFiltros] = useState({
    periodo: "30d",
    agrupamento: "mes", // dia | mes | empresa
    tipo: "ALL", // PJ | PF | ALL
  });

  // ✅ CORRIGIDO
  const chartData = useMemo(() => {
    let filtered = operations.filter(op => op.status === "concluido");

    if (filtros.tipo !== "ALL") {
      filtered = filtered.filter(op => op.tipo === filtros.tipo);
    }

    const result: Record<string, number> = {};

    filtered.forEach(op => {
      const d = new Date(op.data);
      let key = "";

      if (filtros.agrupamento === "mes") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }

      if (filtros.agrupamento === "dia") {
        key = d.toISOString().split("T")[0];
      }

      if (filtros.agrupamento === "empresa") {
        key = clients.find(c => c.id === op.clientId)?.nome ?? "Desconhecido";
      }

      result[key] = (result[key] || 0) + op.valorBruto;
    });

    return Object.entries(result)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({
        label: key,
        total,
      }));
  }, [operations, filtros, clients]);

  const topClients = useMemo(() => {
    const completed = operations.filter(op => op.status === "concluido");
    const byClient: Record<string, number> = {};

    completed.forEach(op => {
      byClient[op.clientId] = (byClient[op.clientId] || 0) + op.valorBruto;
    });

    return Object.entries(byClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, total]) => ({
        nome: clients.find(c => c.id === id)?.nome ?? "Desconhecido",
        total,
      }));
  }, [operations, clients]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* 🔎 FILTROS */}
      <div className="flex flex-wrap gap-3">
        <select
          className="bg-secondary p-2 rounded"
          value={filtros.agrupamento}
          onChange={(e) =>
            setFiltros({ ...filtros, agrupamento: e.target.value })
          }
        >
          <option value="mes">Por mês</option>
          <option value="dia">Por dia</option>
          <option value="empresa">Por empresa</option>
        </select>

        <select
          className="bg-secondary p-2 rounded"
          value={filtros.tipo}
          onChange={(e) =>
            setFiltros({ ...filtros, tipo: e.target.value })
          }
        >
          <option value="ALL">Todos</option>
          <option value="PJ">PJ</option>
          <option value="PF">PF</option>
        </select>
      </div>

      {/* 📊 GRÁFICO */}
      <div className="glass-card rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">
          Movimentação ({filtros.agrupamento})
        </h2>

        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma operação concluída ainda.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" />

              {/* ✅ CORRIGIDO */}
              <XAxis dataKey="label" stroke="hsl(260,8%,55%)" fontSize={12} />

              <YAxis
                stroke="hsl(260,8%,55%)"
                fontSize={12}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />

              <Tooltip
                contentStyle={{
                  background: "hsl(260,18%,10%)",
                  border: "1px solid hsl(260,12%,18%)",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "hsl(260,10%,92%)" }}
                formatter={(v: number) => [formatCurrency(v), "Total"]}
              />

              <Bar dataKey="total" fill="hsl(270,70%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 📈 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Movimentado" value={formatCurrency(stats.totalMovimentado)} icon={DollarSign} variant="primary" />
        <KpiCard title="Lucro Bruto" value={formatCurrency(stats.lucroBrutoTotal)} icon={TrendingUp} variant="success" />
        <KpiCard title="Custo Máquina" value={formatCurrency(stats.totalMaquina)} icon={Cpu} variant="warning" />
        <KpiCard title="Lucro Líquido" value={formatCurrency(stats.lucroLiquidoTotal)} icon={Wallet} variant="primary" />
        <KpiCard title="Repassado" value={formatCurrency(stats.totalRepassado)} icon={ArrowUpRight} />
        <KpiCard title="Operações" value={String(stats.totalOperacoes)} icon={BarChart3} />
      </div>

      {/* 📋 TOP CLIENTES */}
      <div className="glass-card rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">Top Clientes</h2>

        {topClients.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum dado disponível.
          </p>
        ) : (
          <div className="space-y-3">
            {topClients.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-md bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-primary font-bold">
                    #{i + 1}
                  </span>
                  <span className="font-medium">{c.nome}</span>
                </div>
                <span className="font-mono text-sm">
                  {formatCurrency(c.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}