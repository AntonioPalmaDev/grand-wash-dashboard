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
          <SelectTrigger className="w-full sm:w-32 bg-secondary/50 border-white/10 hover:bg-secondary/80 transition-colors">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos PF/PJ</SelectItem>
            <SelectItem value="PF">PF</SelectItem>
            <SelectItem value="PJ">PJ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-40 bg-secondary/50 border-white/10 hover:bg-secondary/80 transition-colors text-white font-semibold">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
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
                  <th className="text-left p-3">Produtos</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-right p-3 font-medium text-muted-foreground uppercase tracking-wider">Valor Bruto / Total</th>
                  <th className="text-right p-3">Taxa / Info</th>
                  <th className="text-right p-3">Lucro Líq.</th>
                  <th className="text-right p-3 font-medium text-muted-foreground uppercase tracking-wider">Ao Cliente</th>
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
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5 min-w-[120px]">
                          {op.category === 'itens' && op.items && op.items.length > 0 ? (
                            op.items.map(item => (
                              <div key={item.id} className="text-[11px] flex items-center gap-1.5 whitespace-nowrap">
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] font-mono min-w-[20px] justify-center bg-white/10">
                                  {item.quantity}x
                                </Badge>
                                <span className="text-white/80 truncate max-w-[100px]">
                                  {item.product?.name || "Produto"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{client?.tipo}</Badge></td>
                      <td className="p-3 text-right font-mono font-bold text-white text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                        {formatCurrency(op.valorBruto)}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {op.category === 'itens' ? (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase">Venda</Badge>
                        ) : (
                          formatPercent(op.taxaPercentual)
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {op.category === 'itens' ? (
                          <span className="text-white font-bold">{formatCurrency(op.valorBruto)}</span>
                        ) : (
                          formatCurrency(op.lucroLiquido)
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        {op.category === 'itens' ? "—" : formatCurrency(op.valorCliente)}
                      </td>
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
