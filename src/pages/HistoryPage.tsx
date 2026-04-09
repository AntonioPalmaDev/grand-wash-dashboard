import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientType } from "@/types";

export default function HistoryPage() {
  const { operations, clients } = useApp();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"all" | ClientType>("all");

  const sorted = useMemo(() => {
    let ops = [...operations].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    if (tipoFilter !== "all") {
      ops = ops.filter(op => {
        const c = clients.find(cl => cl.id === op.clientId);
        return c?.tipo === tipoFilter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      ops = ops.filter(op => {
        const c = clients.find(cl => cl.id === op.clientId);
        return c?.nome.toLowerCase().includes(q);
      });
    }
    return ops;
  }, [operations, clients, search, tipoFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Histórico Geral</h1>
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={tipoFilter} onValueChange={v => setTipoFilter(v as any)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PF">PF</SelectItem>
            <SelectItem value="PJ">PJ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">Nenhuma operação encontrada.</div>
      ) : (
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-right p-3">Valor Bruto</th>
                  <th className="text-right p-3">Taxa</th>
                  <th className="text-right p-3">Lucro Líq.</th>
                  <th className="text-right p-3">Ao Cliente</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-left p-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(op => {
                  const client = clients.find(c => c.id === op.clientId);
                  return (
                    <tr key={op.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-medium">{client?.nome ?? "?"}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{client?.tipo}</Badge></td>
                      <td className="p-3 text-right font-mono">{formatCurrency(op.valorBruto)}</td>
                      <td className="p-3 text-right font-mono">{formatPercent(op.taxaPercentual)}</td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(op.lucroLiquido)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(op.valorCliente)}</td>
                      <td className="p-3 text-center">
                        <Badge variant={op.status === "concluido" ? "default" : op.status === "cancelado" ? "destructive" : "secondary"} className="text-xs">
                          {op.status === "concluido" ? "Concluído" : op.status === "cancelado" ? "Cancelado" : "Pendente"}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{op.responsavel}</td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(op.data)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
