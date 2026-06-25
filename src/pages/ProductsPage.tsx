import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { useCompany } from "@/context/CompanyContext";
import { useModules } from "@/context/ModuleContext";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search, Package, Tag, Info, Loader2, AlertTriangle, CheckCircle2, Cog, Swords, Layers } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types";
import WeaponPartsTab from "@/features/products/WeaponPartsTab";

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const { activeCompany } = useCompany();
  const { canEdit, isDev } = useRole();
  const { isModuleEnabled } = useModules();
  const [activeTab, setActiveTab] = useState("produtos");
  
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [baseValue, setBaseValue] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  
  // Edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      // Filtrar apenas ITENS (remover dinheiro da gestão de produtos conforme solicitado)
      if (p.category !== "itens") return false;
      
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [products, search]);

  async function handleAdd() {
    if (!name.trim()) {
      toast.error("O nome do produto é obrigatório");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addProduct({
        name: name.trim(),
        category: "itens",
        baseValue: Number(baseValue) || 0,
        percentage: 0,
        stockQuantity: Number(stockQuantity) || 0,
        description: description.trim() || undefined,
        status,
        type: "Item"
      });
      toast.success("Produto cadastrado com sucesso!");
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cadastrar produto");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editingProduct || !name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateProduct(editingProduct.id, {
        name: name.trim(),
        baseValue: Number(baseValue) || 0,
        stockQuantity: Number(stockQuantity) || 0,
        description: description.trim() || undefined,
        status
      });
      toast.success("Produto atualizado com sucesso!");
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar produto");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(p: Product) {
    setEditingProduct(p);
    setName(p.name);
    setBaseValue(String(p.baseValue));
    setStockQuantity(String(p.stockQuantity));
    setDescription(p.description || "");
    setStatus(p.status);
  }

  function resetForm() {
    setName("");
    setBaseValue("");
    setStockQuantity("");
    setDescription("");
    setStatus("ativo");
  }




  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="text-primary h-6 w-6" />
            Gestão de Produtos
          </h1>
          <p className="text-muted-foreground text-sm">Controle de estoque e catálogo de itens físicos.</p>
        </div>
        
        {activeTab === "produtos" && canEdit && (
          <Dialog open={open || !!editingProduct} onOpenChange={(v) => {
            if (!v) {
              setOpen(false);
              setEditingProduct(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-secondary/95 border-white/10 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{editingProduct ? "Editar Item" : "Novo Item no Catálogo"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Barra de Ouro, Kit Médico" className="bg-background/50 border-white/10" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseValue">Valor Unitário (R$)</Label>
                    <Input id="baseValue" type="number" value={baseValue} onChange={e => setBaseValue(e.target.value)} placeholder="0.00" className="bg-background/50 border-white/10 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Quantidade em Estoque</Label>
                    <Input id="stock" type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} placeholder="0" className="bg-background/50 border-white/10 font-mono" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status de Disponibilidade</Label>
                  <Select value={status} onValueChange={v => setStatus(v as any)}>
                    <SelectTrigger className="bg-background/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo (Venda Disponível)</SelectItem>
                      <SelectItem value="inativo">Inativo (Fora de Linha)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição / Detalhes</Label>
                  <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Informações adicionais do produto..." className="bg-background/50 border-white/10" />
                </div>
              </div>
              <Button onClick={editingProduct ? handleUpdate : handleAdd} className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? "Salvar Alterações" : "Cadastrar no Estoque"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/40 border border-white/10 p-1 h-auto flex-wrap">
          <TabsTrigger value="produtos" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Package className="h-4 w-4" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="armas" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Swords className="h-4 w-4" /> Armas
          </TabsTrigger>
          {isModuleEnabled("pecas_armas") && (
            <TabsTrigger value="pecas" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
              <Cog className="h-4 w-4" /> Peças de Armas
            </TabsTrigger>
          )}
          <TabsTrigger value="composicao" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Layers className="h-4 w-4" /> Composição
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-6 mt-0">
      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-secondary/20 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome do item..." 
            className="pl-9 bg-background/50 border-white/10" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground bg-white/5 font-bold uppercase text-[11px] tracking-widest">
                <th className="text-left p-4">Produto</th>
                <th className="text-right p-4">Valor Unitário</th>
                <th className="text-center p-4">Estoque Atual</th>
                <th className="text-center p-4">Status</th>
                {canEdit && <th className="text-center p-4">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    Nenhum item físico cadastrado.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const isLowStock = p.stockQuantity <= 5;
                  const isOutOfStock = p.stockQuantity === 0;
                  
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors">{p.name}</p>
                            {p.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-white text-base">
                        {formatCurrency(p.baseValue)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-mono text-sm font-bold ${isLowStock ? 'text-destructive animate-pulse' : 'text-white'}`}>
                            {p.stockQuantity} un
                          </span>
                          {isLowStock && (
                            <Badge variant="destructive" className="text-[8px] h-3 px-1 py-0 uppercase tracking-tighter">
                              Estoque Baixo
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge className={`font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ${p.status === 'ativo' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {p.status === 'ativo' ? (
                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Disponível</span>
                          ) : (
                            'Indisponível'
                          )}
                        </Badge>
                      </td>
                      {canEdit && (
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full" onClick={() => startEdit(p)}>
                              <Pencil size={16} />
                            </Button>
                            {isDev && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteProduct(p.id)}>
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="armas" className="mt-0">
          <div className="glass-card rounded-xl p-12 border border-white/10 text-center text-muted-foreground">
            <Swords className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-white">Catálogo de Armas</p>
            <p className="text-sm">Em breve: cadastro de armas com preço de venda e custo base.</p>
          </div>
        </TabsContent>

        {isModuleEnabled("pecas_armas") && (
          <TabsContent value="pecas" className="mt-0">
            <WeaponPartsTab />
          </TabsContent>
        )}

        <TabsContent value="composicao" className="mt-0">
          <div className="glass-card rounded-xl p-12 border border-white/10 text-center text-muted-foreground">
            <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-white">Composição de Armas</p>
            <p className="text-sm">Em breve: vincular peças às armas para calcular lucro real.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
