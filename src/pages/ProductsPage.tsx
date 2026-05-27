import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { useCompany } from "@/context/CompanyContext";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Package, DollarSign, Tag, Info } from "lucide-react";
import type { Product, ProductCategory } from "@/types";

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const { activeCompany } = useCompany();
  const { canEdit, isDev } = useRole();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ProductCategory>("all");
  const [open, setOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("itens");
  const [type, setType] = useState("");
  const [baseValue, setBaseValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  
  // Edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.type?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  function handleAdd() {
    if (!name.trim()) return;
    addProduct({
      name: name.trim(),
      category,
      type: type.trim() || undefined,
      baseValue: Number(baseValue) || 0,
      percentage: Number(percentage) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      description: description.trim() || undefined,
      status
    });
    resetForm();
    setOpen(false);
  }

  function handleUpdate() {
    if (!editingProduct || !name.trim()) return;
    updateProduct(editingProduct.id, {
      name: name.trim(),
      category,
      type: type.trim() || undefined,
      baseValue: Number(baseValue) || 0,
      percentage: Number(percentage) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      description: description.trim() || undefined,
      status
    });
    setEditingProduct(null);
    resetForm();
  }

  function startEdit(p: Product) {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setType(p.type || "");
    setBaseValue(String(p.baseValue));
    setPercentage(String(p.percentage));
    setStockQuantity(String(p.stockQuantity));
    setDescription(p.description || "");
    setStatus(p.status);
  }

  function resetForm() {
    setName("");
    setCategory("itens");
    setType("");
    setBaseValue("");
    setPercentage("");
    setStockQuantity("");
    setDescription("");
    setStatus("ativo");
  }

  if (activeCompany?.name !== "Black Dragons") {
    return <div className="p-8 text-center text-muted-foreground">Esta página é exclusiva para a Black Dragons.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Produtos</h1>
          <p className="text-muted-foreground text-sm">Controle seu estoque e produtos financeiros.</p>
        </div>
        
        {canEdit && (
          <Dialog open={open || !!editingProduct} onOpenChange={(v) => {
            if (!v) {
              setOpen(false);
              setEditingProduct(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Barra de Ouro" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={category} onValueChange={v => setCategory(v as ProductCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="itens">Itens (Físico)</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro (Financeiro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo / Subcategoria</Label>
                    <Input id="type" value={type} onChange={e => setType(e.target.value)} placeholder="Ex: Luxo, Ilegal, etc" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={v => setStatus(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseValue">Valor Base (R$)</Label>
                    <Input id="baseValue" type="number" value={baseValue} onChange={e => setBaseValue(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Porcentagem (%)</Label>
                    <Input id="percentage" type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="0" disabled={category === "itens"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Estoque</Label>
                    <Input id="stock" type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} placeholder="0" disabled={category === "dinheiro"} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição do produto..." />
                </div>
              </div>
              <Button onClick={editingProduct ? handleUpdate : handleAdd} className="w-full">
                {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-secondary/20 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou tipo..." 
            className="pl-9 bg-background/50" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant={categoryFilter === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter("all")}
            className="flex-1 md:flex-none"
          >
            Todos
          </Button>
          <Button 
            variant={categoryFilter === "itens" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter("itens")}
            className="flex-1 md:flex-none"
          >
            Itens
          </Button>
          <Button 
            variant={categoryFilter === "dinheiro" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter("dinheiro")}
            className="flex-1 md:flex-none"
          >
            Dinheiro
          </Button>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground bg-secondary/30">
                <th className="text-left p-4">Produto</th>
                <th className="text-left p-4">Categoria</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-right p-4">Valor Base</th>
                <th className="text-center p-4">Estoque / %</th>
                <th className="text-center p-4">Status</th>
                {canEdit && <th className="text-center p-4">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground italic">Nenhum produto encontrado.</td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${p.category === 'itens' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {p.category === 'itens' ? <Package size={16} /> : <DollarSign size={16} />}
                        </div>
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          {p.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">
                        {p.category === 'itens' ? 'Itens' : 'Dinheiro'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">{p.type || "—"}</span>
                    </td>
                    <td className="p-4 text-right font-mono font-medium">
                      {formatCurrency(p.baseValue)}
                    </td>
                    <td className="p-4 text-center">
                      {p.category === 'itens' ? (
                        <span className={`font-mono ${p.stockQuantity < 10 ? 'text-destructive font-bold' : ''}`}>
                          {p.stockQuantity} un
                        </span>
                      ) : (
                        <span className="font-mono text-primary font-bold">{p.percentage}%</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={p.status === 'ativo' ? 'bg-success/15 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                        {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => startEdit(p)}>
                            <Pencil size={14} />
                          </Button>
                          {isDev && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(p.id)}>
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}