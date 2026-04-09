import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { Trophy, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RankingPage() {
  const { operations, clients } = useApp();

  const rankings = useMemo(() => {
    const completed = operations.filter(op => op.status === "concluido");
    const byClient: Record<string, { totalLavado: number; lucro: number }> = {};
    completed.forEach(op => {
      if (!byClient[op.clientId]) byClient[op.clientId] = { totalLavado: 0, lucro: 0 };
      byClient[op.clientId].totalLavado += op.valorBruto;
      byClient[op.clientId].lucro += op.lucroLiquido;
    });

    const all = Object.entries(byClient).map(([id, data]) => ({
      client: clients.find(c => c.id === id),
      ...data,
    })).filter(r => r.client);

    const byVolume = [...all].sort((a, b) => b.totalLavado - a.totalLavado);
    const byProfit = [...all].sort((a, b) => b.lucro - a.lucro);
    const pfVolume = byVolume.filter(r => r.client?.tipo === "PF");
    const pjVolume = byVolume.filter(r => r.client?.tipo === "PJ");

    return { byVolume, byProfit, pfVolume, pjVolume };
  }, [operations, clients]);

  function RankList({ title, data, metric, icon: Icon }: { title: string; data: typeof rankings.byVolume; metric: "totalLavado" | "lucro"; icon: typeof Trophy }) {
    return (
      <div className="glass-card rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem dados.</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 10).map((r, i) => (
              <div key={r.client!.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold text-sm ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="font-medium">{r.client!.nome}</span>
                  <Badge variant="outline" className="text-xs">{r.client!.tipo}</Badge>
                </div>
                <span className="font-mono text-sm font-semibold">{formatCurrency(r[metric])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ranking</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankList title="Mais Lavaram (Geral)" data={rankings.byVolume} metric="totalLavado" icon={Trophy} />
        <RankList title="Mais Lucro Gerado" data={rankings.byProfit} metric="lucro" icon={TrendingUp} />
        <RankList title="Top PF" data={rankings.pfVolume} metric="totalLavado" icon={Trophy} />
        <RankList title="Top PJ" data={rankings.pjVolume} metric="totalLavado" icon={Trophy} />
      </div>
    </div>
  );
}
