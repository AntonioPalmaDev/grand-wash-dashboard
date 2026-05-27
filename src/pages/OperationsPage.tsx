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
import { Plus, Check, X, Clock, Trash2, Lock, Pencil, Save, Package, DollarSign, ShoppingCart, Minus } from "lucide-react";
import type { Operation, OperationStatus, ProductCategory } from "@/types";

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
  const { operations, clients, products, addOperation, updateOperationStatus, deleteOperation, getUserName } = useApp();
  const { activeCompany } = useCompany();
  const { isDev, canEdit } = useRole();
  const [open, setOpen] = useState(false);
  
  // Base form state
  const [clientId, setClientId] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [pix, setPix] = useState("");
  
  // Specific form state
  const [category, setCategory] = useState<ProductCategory>("dinheiro");
  const [valorBruto, setValorBruto] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ productId: string, quantity: number }[]>([]);

  // Busca / filtros
  const [search, setSearch] = useState("");
  const [pixFilter, setPixFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OperationStatus>("all");

  const isBlackDragons = activeCompany?.name === "Black Dragons";
  const autoResponsavel = getUserName();

  const { config, getClientRate } = useApp();
  
  const preview = useMemo(() => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return null;

    if (category === "dinheiro") {
      if (!valorBruto || Number(valorBruto) <= 0) return null;
      const vb = Number(valorBruto);
      const taxa = getClientRate(client);
      const lb = vb * (taxa / 100);
      const cm = vb * (config.taxaMaquina / 100);
      return { taxa, lucroBruto: lb, custoMaquina: cm, lucroLiquido: lb - cm, valorCliente: vb - lb, totalBruto: vb };
    } else {
      // Itens flow: 100% de lucro para a empresa, sem taxas ou repasse ao cliente
      if (selectedItems.length === 0) return null;
      let total = 0;
      selectedItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) total += product.baseValue * item.quantity;
      });
      
      const vb = total;
      return { taxa: 0, lucroBruto: vb, custoMaquina: 0, lucroLiquido: vb, valorCliente: 0, totalBruto: total };
    }
  }, [clientId, valorBruto, clients, getClientRate, config, category, selectedItems, products]);

  function handleAdd() {
    if (!clientId) return;
    const finalResponsavel = isDev && responsavel.trim() ? responsavel.trim() : autoResponsavel;
    
    let finalValorBruto = Number(valorBruto);
    let finalItems: any[] = [];
    
    if (category === "itens") {
      finalValorBruto = preview?.totalBruto || 0;
      finalItems = selectedItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product?.baseValue || 0,
          subtotal: (product?.baseValue || 0) * item.quantity
        };
      });
    }

    if (finalValorBruto <= 0) return;

    addOperation({ 
      clientId, 
      valorBruto: finalValorBruto, 
      responsavel: finalResponsavel, 
      pix: pix || null,
      category,
      items: finalItems
    });
    
    resetForm();
    setOpen(false);
  }

  function resetForm() {
    setClientId(""); 
    setValorBruto(""); 
    setResponsavel(""); 
    setPix("");
    setCategory("dinheiro");
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
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Nova Operação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[calc(100vw-2rem)]">
              <DialogHeader><DialogTitle>Registrar Operação</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} ({c.tipo})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {isBlackDragons && (
                    <div>
                      <Label>Tipo de Operação</Label>
                      <Select value={category} onValueChange={v => setCategory(v as ProductCategory)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="itens">Venda de Itens</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {category === "dinheiro" ? (
                  <div>
                    <Label>Valor Bruto (R$)</Label>
                    <Input type="number" inputMode="decimal" value={valorBruto} onChange={e => setValorBruto(e.target.value)} placeholder="0.00" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label>Seleção de Itens</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {products.filter(p => p.category === "itens" && p.status === "ativo").map(product => {
                        const selected = selectedItems.find(i => i.productId === product.id);
                        return (
                          <div key={product.id} className={`flex items-center justify-between p-2 rounded-lg border ${selected ? 'border-primary bg-primary/5' : 'border-border'}`}>
                            <div className="flex items-center gap-3">
                              <Button 
                                variant={selected ? "default" : "outline"} 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => toggleItem(product.id)}
                              >
                                {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              </Button>
                              <div>
                                <p className="text-sm font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(product.baseValue)} | Est: {product.stockQuantity}</p>
                              </div>
                            </div>
                            {selected && (
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(product.id, -1)}><Minus className="h-3 w-3" /></Button>
                                <span className="text-sm font-mono w-4 text-center">{selected.quantity}</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(product.id, 1)}><Plus className="h-3 w-3" /></Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <Label>PIX (opcional)</Label>
                  <Input
                    value={pix}
                    onChange={e => setPix(onlyDigits(e.target.value))}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Somente números"
                  />
                </div>
                <div>
                  <Label>Responsável</Label>
                  {isDev ? (
                    <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder={autoResponsavel} />
                  ) : (
                    <Input value={autoResponsavel} disabled className="opacity-70" />
                  )}
                </div>

                {preview && (
                  <div className="bg-secondary/30 rounded-lg p-4 space-y-2 text-sm">
                    <div className="text-xs font-semibold text-primary mb-2">🧠 Simulação</div>
                    {category === 'dinheiro' && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Taxa</span><span className="font-mono">{formatPercent(preview.taxa)}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-muted-foreground">Valor Total</span><span className="font-mono">{formatCurrency(preview.totalBruto)}</span></div>
                    {category === 'dinheiro' && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Custo Máquina</span><span className="font-mono">{formatCurrency(preview.custoMaquina)}</span></div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{category === 'itens' ? 'Lucro Total' : 'Lucro Líquido'}</span>
                      <span className="font-mono font-bold text-primary">{formatCurrency(preview.lucroLiquido)}</span>
                    </div>
                    {category === 'dinheiro' && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Valor ao Cliente</span><span className="font-mono">{formatCurrency(preview.valorCliente)}</span></div>
                    )}
                  </div>
                )}

                <Button onClick={handleAdd} className="w-full" disabled={!clientId || (category === "dinheiro" && (!valorBruto || Number(valorBruto) <= 0)) || (category === "itens" && selectedItems.length === 0)}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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
                      <div className="font-semibold truncate flex items-center gap-2">
                        {client?.nome ?? "?"}
                        {op.category === 'itens' && <Package className="h-3 w-3 text-primary" />}
                      </div>
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
                      <div className="text-[10px] text-muted-foreground uppercase">Total / Lucro</div>
                      <div className="font-mono font-semibold text-primary">{formatCurrency(op.valorBruto)}</div>
                    </div>
                    {op.category === 'dinheiro' && (
                      <div className="bg-secondary/20 rounded p-2">
                        <div className="text-[10px] text-muted-foreground uppercase">Lucro Líq.</div>
                        <div className="font-mono font-semibold text-primary">{formatCurrency(op.lucroLiquido)}</div>
                      </div>
                    )}
                    {op.category === 'dinheiro' && (
                      <>
                        <div className="bg-secondary/20 rounded p-2">
                          <div className="text-[10px] text-muted-foreground uppercase">Taxa</div>
                          <div className="font-mono">{formatPercent(op.taxaPercentual)}</div>
                        </div>
                        <div className="bg-secondary/20 rounded p-2">
                          <div className="text-[10px] text-muted-foreground uppercase">Ao Cliente</div>
                          <div className="font-mono">{formatCurrency(op.valorCliente)}</div>
                        </div>
                      </>
                    )}
                    <div className="bg-secondary/20 rounded p-2 col-span-2">
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">PIX</div>
                      <PixInlineEditor op={op} />
                    </div>
                    {op.category === 'itens' && op.items && op.items.length > 0 && (
                      <div className="bg-primary/5 rounded p-2 col-span-2 border border-primary/10">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">Itens Vendidos</div>
                        <div className="space-y-1">
                          {op.items.map(item => (
                            <div key={item.id} className="flex justify-between text-[10px]">
                              <span>{item.product?.name || "Produto Removido"} x{item.quantity}</span>
                              <span className="font-mono">{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {op.category === 'itens' && <Package className="h-3 w-3 text-primary" />}
                            <span className="font-medium">{client?.nome ?? "?"}</span>
                          </div>
                        </td>
                        <td className="p-3"><Badge variant="outline" className="text-xs">{client?.tipo}</Badge></td>
                        <td className="p-3 text-right font-mono font-semibold text-primary">{formatCurrency(op.valorBruto)}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{op.category === 'itens' ? "—" : formatPercent(op.taxaPercentual)}</td>
                        <td className="p-3 text-right font-mono font-semibold">{op.category === 'itens' ? "—" : formatCurrency(op.lucroLiquido)}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground">{op.category === 'itens' ? "—" : formatCurrency(op.valorCliente)}</td>
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
