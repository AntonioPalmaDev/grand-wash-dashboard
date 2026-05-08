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
import { Plus, Check, X, Clock, Trash2, Lock, Pencil, Save } from "lucide-react";
import type { Operation, OperationStatus } from "@/types";

const statusConfig: Record<OperationStatus, { label: string; color: string; icon: typeof Check }> = {
  pendente: { label: "Pendente", color: "bg-warning/15 text-warning", icon: Clock },
  concluido: { label: "Concluído", color: "bg-success/15 text-success", icon: Check },
  cancelado: { label: "Cancelado", color: "bg-destructive/15 text-destructive", icon: X },
};

// Apenas dígitos
const onlyDigits = (v: string) => v.replace(/\D/g, "");

function PixInlineEditor({ op }: { op: Operation }) {
  const { updateOperationPix } = useApp();
  const locked = op.status === "concluido" || op.status === "cancelado";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(op.pix ?? "");

  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        {op.pix || "—"}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(op.pix ?? ""); setEditing(true); }}
        className="inline-flex items-center gap-1 font-mono text-xs hover:text-primary transition-colors"
      >
        <Pencil className="h-3 w-3 opacity-60" />
        {op.pix || <span className="text-muted-foreground italic">adicionar</span>}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(onlyDigits(e.target.value))}
        inputMode="numeric"
        pattern="[0-9]*"
        className="h-7 w-32 text-xs font-mono"
        placeholder="Somente números"
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2"
        onClick={async () => { await updateOperationPix(op.id, value || null); setEditing(false); }}
      >
        <Save className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(false)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function OperationsPage() {
  const { operations, clients, addOperation, updateOperationStatus, deleteOperation, getUserName } = useApp();
  const { isDev } = useRole();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [valorBruto, setValorBruto] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [pix, setPix] = useState("");

  // Busca / filtros
  const [search, setSearch] = useState("");
  const [pixFilter, setPixFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OperationStatus>("all");

  const autoResponsavel = getUserName();

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
    const finalResponsavel = isDev && responsavel.trim() ? responsavel.trim() : autoResponsavel;
    addOperation({ clientId, valorBruto: Number(valorBruto), responsavel: finalResponsavel, pix: pix || null });
    setClientId(""); setValorBruto(""); setResponsavel(""); setPix(""); setOpen(false);
  }

  const sorted = useMemo(() => {
    let list = [...operations].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(op => {
        const c = clients.find(cl => cl.id === op.clientId);
        return (c?.nome.toLowerCase().includes(q)) || (op.pix ?? "").includes(q);
      });
    }
    if (pixFilter.trim()) {
      const pf = onlyDigits(pixFilter);
      if (pf) list = list.filter(op => (op.pix ?? "").includes(pf));
    }
    if (statusFilter !== "all") list = list.filter(op => op.status === statusFilter);
    return list;
  }, [operations, clients, search, pixFilter, statusFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Operações</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Nova Operação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg w-[calc(100vw-2rem)]">
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
                <Input type="number" inputMode="decimal" value={valorBruto} onChange={e => setValorBruto(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>PIX (opcional)</Label>
                <Input
                  value={pix}
                  onChange={e => setPix(onlyDigits(e.target.value))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Somente números"
                />
                <p className="text-xs text-muted-foreground mt-1">Aceita apenas dígitos. Bloqueia após conclusão.</p>
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Input
          placeholder="Buscar cliente ou PIX..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Input
          placeholder="Filtrar por PIX (números)"
          value={pixFilter}
          onChange={e => setPixFilter(onlyDigits(e.target.value))}
          inputMode="numeric"
          className="sm:max-w-xs font-mono"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">Nenhuma operação encontrada.</div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {sorted.map(op => {
              const client = clients.find(c => c.id === op.clientId);
              const sc = statusConfig[op.status];
              const StatusIcon = sc.icon;
              return (
                <div key={op.id} className="glass-card rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{client?.nome ?? "?"}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{client?.tipo}</Badge>
                        <span className="text-[11px] text-muted-foreground">{formatDate(op.data)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                      <StatusIcon className="h-3 w-3" /> {sc.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-secondary/20 rounded p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Bruto</div>
                      <div className="font-mono font-semibold">{formatCurrency(op.valorBruto)}</div>
                    </div>
                    <div className="bg-secondary/20 rounded p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Lucro Líq.</div>
                      <div className="font-mono font-semibold text-primary">{formatCurrency(op.lucroLiquido)}</div>
                    </div>
                    <div className="bg-secondary/20 rounded p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Taxa</div>
                      <div className="font-mono">{formatPercent(op.taxaPercentual)}</div>
                    </div>
                    <div className="bg-secondary/20 rounded p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Ao Cliente</div>
                      <div className="font-mono">{formatCurrency(op.valorCliente)}</div>
                    </div>
                    <div className="bg-secondary/20 rounded p-2 col-span-2">
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">PIX</div>
                      <PixInlineEditor op={op} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                    <span className="text-[11px] text-muted-foreground truncate">{op.responsavel}</span>
                    <div className="flex gap-1 shrink-0">
                      {op.status === "pendente" && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-success" onClick={() => updateOperationStatus(op.id, "concluido")}>✓</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => updateOperationStatus(op.id, "cancelado")}>✗</Button>
                        </>
                      )}
                      {isDev && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => deleteOperation(op.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: tabela */}
          <div className="glass-card rounded-lg overflow-hidden hidden lg:block">
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
                    <th className="text-left p-3">PIX</th>
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
                        <td className="p-3"><PixInlineEditor op={op} /></td>
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
        </>
      )}
    </div>
  );
}
