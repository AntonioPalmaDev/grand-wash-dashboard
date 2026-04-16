import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Clock, Trash2 } from "lucide-react";
import type { OperationStatus } from "@/types";

const statusConfig: Record<OperationStatus, { label: string; color: string; icon: typeof Check }> = {
  pendente: { label: "Pendente", color: "bg-warning/15 text-warning", icon: Clock },
  concluido: { label: "Concluído", color: "bg-success/15 text-success", icon: Check },
  cancelado: { label: "Cancelado", color: "bg-destructive/15 text-destructive", icon: X },
};

export default function OperationsPage() {
  const { operations, clients, addOperation, updateOperationStatus, deleteOperation, getUserName } = useApp();
  const { isDev } = useRole();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [valorBruto, setValorBruto] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Auto-fill responsável with logged user name
  const autoResponsavel = getUserName();

  // Simulator
  const { config, getClientRate } = useApp();
  const preview = useMemo(() => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !valorBruto || Number(valorBruto) <= 0) return null;
    const vb = Number(valorBruto);
    const taxa = getClientRate(client);
    const lb = vb * (taxa / 100);
    const cm = vb * (config.taxaMaquina / 100);
    return { taxa, lucroBruto: lb, custoMaquina: cm, lucroLiquido: lb - cm, valorCliente: vb - lb };
  }, [clientId, valorBruto, clients, getClientRate, config]);

  function handleAdd() {
    if (!clientId || !valorBruto || Number(valorBruto) <= 0) return;
    // Dev can override responsável, otherwise use auto
    const finalResponsavel = isDev && responsavel.trim() ? responsavel.trim() : autoResponsavel;
    addOperation({ clientId, valorBruto: Number(valorBruto), responsavel: finalResponsavel });
    setClientId(""); setValorBruto(""); setResponsavel(""); setOpen(false);
  }

  const sorted = [...operations].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Operações</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Operação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar Operação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} ({c.tipo})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor Bruto (R$)</Label>
                <Input type="number" value={valorBruto} onChange={e => setValorBruto(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Responsável</Label>
                {isDev ? (
                  <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder={autoResponsavel} />
                ) : (
                  <Input value={autoResponsavel} disabled className="opacity-70" />
                )}
                {!isDev && <p className="text-xs text-muted-foreground mt-1">Preenchido automaticamente com seu usuário</p>}
              </div>

              {preview && (
                <div className="bg-secondary/30 rounded-lg p-4 space-y-2 text-sm">
                  <div className="text-xs font-semibold text-primary mb-2">🧠 Simulação</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxa</span><span className="font-mono">{formatPercent(preview.taxa)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Lucro Bruto</span><span className="font-mono">{formatCurrency(preview.lucroBruto)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Custo Máquina</span><span className="font-mono">{formatCurrency(preview.custoMaquina)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Lucro Líquido</span><span className="font-mono font-bold text-primary">{formatCurrency(preview.lucroLiquido)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor ao Cliente</span><span className="font-mono">{formatCurrency(preview.valorCliente)}</span></div>
                </div>
              )}

              <Button onClick={handleAdd} className="w-full" disabled={!clientId || !valorBruto || Number(valorBruto) <= 0}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">Nenhuma operação registrada.</div>
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
                  <th className="text-center p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(op => {
                  const client = clients.find(c => c.id === op.clientId);
                  const sc = statusConfig[op.status];
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={op.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-medium">{client?.nome ?? "?"}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{client?.tipo}</Badge></td>
                      <td className="p-3 text-right font-mono">{formatCurrency(op.valorBruto)}</td>
                      <td className="p-3 text-right font-mono">{formatPercent(op.taxaPercentual)}</td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(op.lucroLiquido)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(op.valorCliente)}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" /> {sc.label}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{op.responsavel}</td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(op.data)}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {op.status === "pendente" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-success" onClick={() => updateOperationStatus(op.id, "concluido")}>✓</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => updateOperationStatus(op.id, "cancelado")}>✗</Button>
                            </>
                          )}
                          {isDev && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteOperation(op.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
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
