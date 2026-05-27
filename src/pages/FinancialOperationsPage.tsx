import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { useCompany } from "@/context/CompanyContext";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Check, X, Clock, Trash2, Lock, Pencil, Save, DollarSign, TrendingUp, Users } from "lucide-react";
import type { Operation, OperationStatus } from "@/types";

const statusConfig: Record<OperationStatus, { label: string; color: string; icon: typeof Check }> = {
  pendente: { label: "Pendente", color: "bg-warning/15 text-warning", icon: Clock },
  concluido: { label: "Concluído", color: "bg-success/15 text-success", icon: Check },
  cancelado: { label: "Cancelado", color: "bg-destructive/15 text-destructive", icon: X },
};

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

export default function FinancialOperationsPage() {
  const { operations, clients, addOperation, updateOperationStatus, deleteOperation, getUserName, config, getClientRate, getStats } = useApp();
  const { activeCompany } = useCompany();
  const { isDev, canEdit } = useRole();
  const [open, setOpen] = useState(false);
  
  // Base form state
  const [clientId, setClientId] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [pix, setPix] = useState("");
  const [operationType, setOperationType] = useState("");
  const [valorBruto, setValorBruto] = useState("");

  // Busca / filtros
  const [search, setSearch] = useState("");
  const [pixFilter, setPixFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OperationStatus>("all");
  const [responsavelFilter, setResponsavelFilter] = useState("all");

  const autoResponsavel = getUserName();
  const stats = getStats();

  const preview = useMemo(() => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !valorBruto) return null;

    const totalBruto = Number(valorBruto);
    const taxa = getClientRate(client);
    const lb = totalBruto * (taxa / 100);
    const cm = totalBruto * (config.taxaMaquina / 100);
    
    return { 
      taxa, 
      lucroBruto: lb, 
      custoMaquina: cm, 
      lucroLiquido: lb - cm, 
      valorCliente: totalBruto - lb, 
      totalBruto 
    };
  }, [clientId, valorBruto, clients, getClientRate, config]);

  function handleAdd() {
    if (!clientId || !valorBruto) return;
    const finalResponsavel = isDev && responsavel.trim() ? responsavel.trim() : autoResponsavel;
    
    addOperation({ 
      clientId, 
      valorBruto: Number(valorBruto), 
      responsavel: finalResponsavel, 
      pix: pix || null,
      category: "dinheiro",
      operationType: operationType.trim() || null
    });
    
    resetForm();
    setOpen(false);
  }

  function resetForm() {
    setClientId(""); 
    setValorBruto(""); 
    setResponsavel(""); 
    setPix("");
    setOperationType("");
  }

  const sorted = useMemo(() => {
    let list = operations
      .filter(op => op.category === "dinheiro")
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
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
    if (responsavelFilter !== "all") list = list.filter(op => op.responsavel === responsavelFilter);
    
    return list;
  }, [operations, clients, search, pixFilter, statusFilter, responsavelFilter]);

  const uniqueResponsaveis = useMemo(() => {
    const set = new Set(operations.map(op => op.responsavel));
    return Array.from(set).sort();
  }, [operations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-primary h-6 w-6" />
            Operações Financeiras
          </h1>
          <p className="text-muted-foreground text-sm">Gerenciamento de lavagens e transações financeiras.</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Plus className="mr-2 h-4 w-4" /> Criar Operação Financeira
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-secondary/95 border-white/10 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Registrar Financeiro
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="bg-background/50 border-white/10">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} ({c.tipo})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Operação</Label>
                  <Input 
                    value={operationType} 
                    onChange={e => setOperationType(e.target.value)} 
                    placeholder="Ex: Lavagem, Câmbio, Investimento"
                    className="bg-background/50 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Bruto (R$)</Label>
                  <Input 
                    type="number" 
                    inputMode="decimal" 
                    value={valorBruto} 
                    onChange={e => setValorBruto(e.target.value)} 
                    placeholder="0.00"
                    className="bg-background/50 border-white/10 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label>PIX (opcional)</Label>
                  <Input
                    value={pix}
                    onChange={e => setPix(onlyDigits(e.target.value))}
                    inputMode="numeric"
                    placeholder="Chave PIX (apenas números)"
                    className="bg-background/50 border-white/10 font-mono"
                  />
                </div>

                {preview && (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-2 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Simulação Financeira</span>
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Taxa: {formatPercent(preview.taxa)}</Badge>
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Valor Total</span><span className="font-mono text-white">{formatCurrency(preview.totalBruto)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Custo Máquina</span><span className="font-mono text-destructive/80">{formatCurrency(preview.custoMaquina)}</span></div>
                    <div className="flex justify-between pt-1 border-t border-white/5">
                      <span className="text-white font-medium">Lucro Líquido</span>
                      <span className="font-mono font-bold text-success text-base">{formatCurrency(preview.lucroLiquido)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor ao Cliente</span>
                      <span className="font-mono text-white">{formatCurrency(preview.valorCliente)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleAdd} 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-2" 
                  disabled={!clientId || !valorBruto || Number(valorBruto) <= 0}
                >
                  Finalizar Operação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-secondary/40 border-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Movimentado</p>
                <h3 className="text-2xl font-black text-white">{formatCurrency(stats.totalMovimentado)}</h3>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40 border-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Lucro Líquido</p>
                <h3 className="text-2xl font-black text-success">{formatCurrency(stats.lucroLiquidoTotal)}</h3>
              </div>
              <div className="bg-success/10 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-success" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40 border-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Taxa Média</p>
                <h3 className="text-2xl font-black text-primary">{formatPercent(stats.taxaMedia)}</h3>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg"><Zap className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40 border-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Operações</p>
                <h3 className="text-2xl font-black text-white">{stats.operacoesConcluidas}</h3>
              </div>
              <div className="bg-secondary/20 p-2 rounded-lg"><Users className="h-5 w-5 text-muted-foreground" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-secondary/20 rounded-xl border border-white/5">
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-background/50 border-white/10"
        />
        <Input
          placeholder="Filtrar PIX"
          value={pixFilter}
          onChange={e => setPixFilter(onlyDigits(e.target.value))}
          className="w-full sm:w-40 font-mono bg-background/50 border-white/10"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-40 bg-background/50 border-white/10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-background/50 border-white/10">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Responsáveis</SelectItem>
            {uniqueResponsaveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-muted-foreground font-bold uppercase text-[11px] tracking-widest">
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-right p-4">Valor Bruto</th>
                <th className="text-right p-4">Taxa %</th>
                <th className="text-right p-4">Lucro Líquido</th>
                <th className="text-right p-4">Valor Cliente</th>
                <th className="text-left p-4">PIX</th>
                <th className="text-center p-4">Status</th>
                <th className="text-left p-4">Responsável</th>
                <th className="text-left p-4">Data</th>
                <th className="text-center p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(op => {
                const client = clients.find(c => c.id === op.clientId);
                const sc = statusConfig[op.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={op.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{client?.nome ?? "?"}</div>
                      <div className="text-[10px] text-muted-foreground">{client?.tipo}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {op.operationType || "Financeiro"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white">{formatCurrency(op.valorBruto)}</td>
                    <td className="p-4 text-right font-mono text-muted-foreground">{formatPercent(op.taxaPercentual)}</td>
                    <td className="p-4 text-right font-mono font-bold text-success">{formatCurrency(op.lucroLiquido)}</td>
                    <td className="p-4 text-right font-mono text-white">{formatCurrency(op.valorCliente)}</td>
                    <td className="p-4"><PixInlineEditor op={op} /></td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${sc.color}`}>
                        <StatusIcon className="h-3 w-3" /> {sc.label}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{op.responsavel}</td>
                    <td className="p-4 text-xs text-muted-foreground">{formatDate(op.data)}</td>
                    <td className="p-4 text-center">
                      <div className="flex gap-1 justify-center">
                        {op.status === "pendente" && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:bg-success/10" onClick={() => updateOperationStatus(op.id, "concluido")} title="Concluir">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => updateOperationStatus(op.id, "cancelado")} title="Cancelar">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isDev && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteOperation(op.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-muted-foreground italic">Nenhuma operação financeira encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { Zap } from "lucide-react";
