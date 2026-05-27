import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientType } from "@/types";

export default function HistoryPage() {
  const { operations, clients } = useApp();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"all" | ClientType>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "dinheiro" | "itens">("all");

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
    if (categoryFilter !== "all") {
      ops = ops.filter(op => op.category === categoryFilter);
    }
    return ops;
  }, [operations, clients, search, tipoFilter, categoryFilter]);

  const hasDinheiro = useMemo(() => sorted.some(op => op.category === 'dinheiro'), [sorted]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Histórico Geral</h1>
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={tipoFilter} onValueChange={v => setTipoFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos PF/PJ</SelectItem>
            <SelectItem value="PF">PF</SelectItem>
            <SelectItem value="PJ">PJ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="itens">Venda de Itens</SelectItem>
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
                  {!hasDinheiro && <th className="text-left p-3">Produtos</th>}
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-right p-3">{!hasDinheiro ? "Total / Lucro" : "Valor Bruto"}</th>
                  {hasDinheiro && (
                    <>
                      <th className="text-right p-3">Taxa</th>
                      <th className="text-right p-3">Lucro Líq.</th>
                      <th className="text-right p-3">Ao Cliente</th>
                    </>
                  )}
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
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {op.category === 'itens' && <Package className="h-3 w-3 text-primary" />}
                          <span className="font-medium">{client?.nome ?? "?"}</span>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{client?.tipo}</Badge></td>
                      <td className="p-3 text-right font-mono font-semibold text-primary">{formatCurrency(op.valorBruto)}</td>
                      {hasDinheiro && (
                        <>
                          <td className="p-3 text-right font-mono text-muted-foreground">{op.category === 'itens' ? "—" : formatPercent(op.taxaPercentual)}</td>
                          <td className="p-3 text-right font-mono font-semibold">{op.category === 'itens' ? "—" : formatCurrency(op.lucroLiquido)}</td>
                          <td className="p-3 text-right font-mono text-muted-foreground">{op.category === 'itens' ? "—" : formatCurrency(op.valorCliente)}</td>
                        </>
                      )}
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
