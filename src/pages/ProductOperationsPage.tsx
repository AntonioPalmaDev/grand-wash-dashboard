import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { useCompany } from "@/context/CompanyContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Check, X, Clock, Trash2, Package, ShoppingCart, Minus, TrendingUp, ShoppingBag, AlertTriangle } from "lucide-react";
import type { Operation, OperationStatus } from "@/types";

const statusConfig: Record<OperationStatus, { label: string; color: string; icon: typeof Check }> = {
  pendente: { label: "Pendente", color: "bg-warning/15 text-warning", icon: Clock },
  concluido: { label: "Concluído", color: "bg-success/15 text-success", icon: Check },
  cancelado: { label: "Cancelado", color: "bg-destructive/15 text-destructive", icon: X },
};

export default function ProductOperationsPage() {
  const { operations, clients, products, addOperation, updateOperationStatus, deleteOperation, getUserName, getStats } = useApp();
  const { isDev, canEdit } = useRole();
  const [open, setOpen] = useState(false);
  
  // Base form state
  const [clientId, setClientId] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ productId: string, quantity: number }[]>([]);

  // Busca / filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OperationStatus>("all");
  const [responsavelFilter, setResponsavelFilter] = useState("all");

  const autoResponsavel = getUserName();
  const stats = getStats();

  const preview = useMemo(() => {
    const client = clients.find(c => c.id === clientId);
    if (!client || selectedItems.length === 0) return null;

    let totalBruto = 0;
    let totalItems = 0;

    selectedItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        totalBruto += product.baseValue * item.quantity;
        totalItems += item.quantity;
      }
    });

    if (totalBruto <= 0) return null;

    return { totalBruto, totalItems };
  }, [clientId, selectedItems, products, clients]);

  function handleAdd() {
    if (!clientId || selectedItems.length === 0) return;
    const finalResponsavel = isDev && responsavel.trim() ? responsavel.trim() : autoResponsavel;
    
    const finalItems = selectedItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product?.baseValue || 0,
        subtotal: (product?.baseValue || 0) * item.quantity
      };
    });

    addOperation({ 
      clientId, 
      valorBruto: preview?.totalBruto || 0, 
      responsavel: finalResponsavel, 
      category: "itens",
      items: finalItems
    });
    
    resetForm();
    setOpen(false);
  }

  function resetForm() {
    setClientId(""); 
    setResponsavel(""); 
    setSelectedItems([]);
  }

  function toggleItem(productId: string) {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.productId === productId);
      if (exists) return prev.filter(i => i.productId !== productId);
      return [...prev, { productId, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setSelectedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  }

  const sorted = useMemo(() => {
    let list = operations
      .filter(op => op.category === "itens")
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(op => {
        const c = clients.find(cl => cl.id === op.clientId);
        return (c?.nome.toLowerCase().includes(q));
      });
    }
    if (statusFilter !== "all") list = list.filter(op => op.status === statusFilter);
    if (responsavelFilter !== "all") list = list.filter(op => op.responsavel === responsavelFilter);
    
    return list;
  }, [operations, clients, search, statusFilter, responsavelFilter]);

  const uniqueResponsaveis = useMemo(() => {
    const set = new Set(operations.map(op => op.responsavel));
    return Array.from(set).sort();
  }, [operations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-primary h-6 w-6" />
            Operações de Produtos
          </h1>
          <p className="text-muted-foreground text-sm">Controle de vendas e saída de itens do estoque.</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Plus className="mr-2 h-4 w-4" /> Nova Venda de Produtos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-secondary/95 border-white/10 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Registrar Venda
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-1">
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
                
                <div className="space-y-3">
                  <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Adicionar Itens</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {products.filter(p => p.category === "itens" && p.status === "ativo").map(product => {
                      const selected = selectedItems.find(i => i.productId === product.id);
                      const isLowStock = product.stockQuantity <= 5;
                      return (
                        <div key={product.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selected ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant={selected ? "default" : "outline"} 
                              size="icon" 
                              className={`h-9 w-9 rounded-full ${selected ? 'bg-primary' : 'border-white/20'}`}
                              onClick={() => toggleItem(product.id)}
                            >
                              {selected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </Button>
                            <div>
                              <p className="text-sm font-bold text-white">{product.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-primary font-mono">{formatCurrency(product.baseValue)}</span>
                                <Badge variant="outline" className={`text-[9px] h-4 px-1 ${isLowStock ? 'border-destructive text-destructive' : 'border-white/10 text-muted-foreground'}`}>
                                  Estoque: {product.stockQuantity}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {selected && (
                            <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/10" onClick={() => updateQuantity(product.id, -1)}><Minus className="h-3 w-3" /></Button>
                              <span className="text-sm font-mono font-bold w-6 text-center text-white">{selected.quantity}</span>
                              <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/10" onClick={() => updateQuantity(product.id, 1)} disabled={selected.quantity >= product.stockQuantity}><Plus className="h-3 w-3" /></Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {preview && (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-2 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Resumo da Venda</span>
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{preview.totalItems} itens</Badge>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-white/5">
                      <span className="text-white font-medium">Valor Total</span>
                      <span className="font-mono font-black text-white text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{formatCurrency(preview.totalBruto)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleAdd} 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-2" 
                  disabled={!clientId || selectedItems.length === 0}
                >
                  Concluir Venda
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
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Vendas Concluídas</p>
                <h3 className="text-2xl font-black text-white">{stats.produtosVendidos}</h3>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg"><ShoppingBag className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40 border-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Itens Vendidos</p>
                <h3 className="text-2xl font-black text-white">{stats.quantidadeTotalItens}</h3>
              </div>
              <div className="bg-white/5 p-2 rounded-lg"><Package className="h-5 w-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40 border-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Estoque Baixo</p>
                <h3 className="text-2xl font-black text-destructive">{stats.estoqueBaixoCount}</h3>
              </div>
              <div className="bg-destructive/10 p-2 rounded-lg"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40 border-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Faturamento Total</p>
                <h3 className="text-2xl font-black text-success">{formatCurrency(stats.faturamentoProdutos)}</h3>
              </div>
              <div className="bg-success/10 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-success" /></div>
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
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-48 bg-background/50 border-white/10">
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
          <SelectTrigger className="w-full sm:w-48 bg-background/50 border-white/10">
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
                <th className="text-left p-4">Produtos</th>
                <th className="text-center p-4">Quantidade Total</th>
                <th className="text-right p-4">Valor Total</th>
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
                const totalQty = op.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                
                return (
                  <tr key={op.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{client?.nome ?? "?"}</div>
                      <div className="text-[10px] text-muted-foreground">{client?.tipo}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {op.items?.map(item => (
                          <div key={item.id} className="text-[11px] flex items-center justify-between gap-2">
                            <span className="text-white/70 truncate">{item.product?.name || "Produto"}</span>
                            <Badge variant="outline" className="h-4 px-1 text-[9px] font-mono border-white/10 text-muted-foreground">x{item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-white font-bold">{totalQty}</td>
                    <td className="p-4 text-right font-mono font-black text-white text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{formatCurrency(op.valorBruto)}</td>
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
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:bg-success/10" onClick={() => updateOperationStatus(op.id, "concluido")}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => updateOperationStatus(op.id, "cancelado")}>
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
                  <td colSpan={8} className="p-8 text-center text-muted-foreground italic">Nenhuma operação de produtos encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
