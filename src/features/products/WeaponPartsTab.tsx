import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/hooks/useRole";
import { formatCurrency } from "@/lib/format";
import { registrarLog } from "@/lib/logging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Cog,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export interface WeaponPart {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit_cost: number;
  stock_quantity: number;
  status: "ativo" | "inativo";
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function WeaponPartsTab() {
  const { user, nomePersonagem } = useAuth();
  const { activeCompany } = useCompany();
  const { canEdit } = useRole();

  const [parts, setParts] = useState<WeaponPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WeaponPart | null>(null);
  const [saving, setSaving] = useState(false);

  // form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [description, setDescription] = useState("");

  const fetchParts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("weapon_parts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar peças");
    } else {
      setParts((data || []) as WeaponPart[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parts.filter((p) => {
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    });
  }, [parts, search, statusFilter]);

  const totals = useMemo(() => {
    const totalInvestido = parts.reduce(
      (acc, p) => acc + Number(p.unit_cost) * Number(p.stock_quantity),
      0,
    );
    const ativas = parts.filter((p) => p.status === "ativo").length;
    const estoqueZero = parts.filter((p) => Number(p.stock_quantity) === 0).length;
    return { totalInvestido, ativas, estoqueZero, total: parts.length };
  }, [parts]);

  function resetForm() {
    setName("");
    setSku("");
    setCategory("");
    setUnitCost("");
    setStockQuantity("");
    setStatus("ativo");
    setDescription("");
    setEditing(null);
  }

  function startEdit(p: WeaponPart) {
    setEditing(p);
    setName(p.name);
    setSku(p.sku || "");
    setCategory(p.category || "");
    setUnitCost(String(p.unit_cost));
    setStockQuantity(String(p.stock_quantity));
    setStatus(p.status);
    setDescription(p.description || "");
    setOpen(true);
  }

  async function logAction(action: string, entityId: string, description: string) {
    if (!user) return;
    try {
      await registrarLog({
        userId: user.id,
        userEmail: user.email || "",
        nomePersonagem: nomePersonagem ?? null,
        companyId: activeCompany?.id ?? null,
        action,
        entity: "weapon_parts",
        entityId,
        description,
      });
    } catch (e) {
      console.warn("log failed", e);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nome da peça é obrigatório");
      return;
    }
    const cost = Number(unitCost) || 0;
    const stock = Number(stockQuantity) || 0;
    if (cost < 0) return toast.error("Custo não pode ser negativo");
    if (stock < 0) return toast.error("Estoque não pode ser negativo");

    setSaving(true);
    const payload = {
      name: name.trim(),
      sku: sku.trim() || null,
      category: category.trim() || null,
      unit_cost: cost,
      stock_quantity: stock,
      status,
      description: description.trim() || null,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from("weapon_parts")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Peça atualizada");
        await logAction(
          "editar",
          editing.id,
          `Peça '${payload.name}' editada por ${nomePersonagem || user?.email}`,
        );
      } else {
        const { data, error } = await supabase
          .from("weapon_parts")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        toast.success("Peça cadastrada");
        await logAction(
          "criar",
          data!.id,
          `Peça '${payload.name}' cadastrada por ${nomePersonagem || user?.email}`,
        );
      }
      setOpen(false);
      resetForm();
      fetchParts();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(p: WeaponPart) {
    const next = p.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase
      .from("weapon_parts")
      .update({ status: next })
      .eq("id", p.id);
    if (error) return toast.error("Erro ao alterar status");
    toast.success(next === "ativo" ? "Peça reativada" : "Peça inativada");
    await logAction(
      next === "ativo" ? "reativar" : "inativar",
      p.id,
      `Peça '${p.name}' ${next === "ativo" ? "reativada" : "inativada"} por ${nomePersonagem || user?.email}`,
    );
    fetchParts();
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total de Peças</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{totals.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Ativas</p>
          <p className="text-2xl font-bold text-success mt-1 font-mono">{totals.ativas}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Estoque Zero</p>
          <p className="text-2xl font-bold text-destructive mt-1 font-mono">{totals.estoqueZero}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Investido</p>
          <p className="text-2xl font-bold text-primary mt-1 font-mono">
            {formatCurrency(totals.totalInvestido)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-secondary/20 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            className="pl-9 bg-background/50 border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full md:w-48 bg-background/50 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativas</SelectItem>
            <SelectItem value="inativo">Inativas</SelectItem>
          </SelectContent>
        </Select>

        {canEdit && (
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="mr-2 h-4 w-4" /> Nova Peça
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] bg-secondary/95 border-white/10 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {editing ? "Editar Peça" : "Cadastrar Peça"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Nome da Peça *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cano de aço"
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="opcional"
                      className="bg-background/50 border-white/10 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="opcional"
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Custo Unitário (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="0.00"
                      className="bg-background/50 border-white/10 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade em Estoque</Label>
                    <Input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="0"
                      className="bg-background/50 border-white/10 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                    <SelectTrigger className="bg-background/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativa</SelectItem>
                      <SelectItem value="inativo">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="opcional"
                    className="bg-background/50 border-white/10"
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Salvar Alterações" : "Cadastrar Peça"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabela */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground bg-white/5 font-bold uppercase text-[11px] tracking-widest">
                <th className="text-left p-4 whitespace-nowrap">Peça</th>
                <th className="text-left p-4 whitespace-nowrap">SKU</th>
                <th className="text-left p-4 whitespace-nowrap">Categoria</th>
                <th className="text-right p-4 whitespace-nowrap">Custo Unitário</th>
                <th className="text-center p-4 whitespace-nowrap">Estoque</th>
                <th className="text-right p-4 whitespace-nowrap">Total Investido</th>
                <th className="text-center p-4 whitespace-nowrap">Status</th>
                {canEdit && <th className="text-center p-4 whitespace-nowrap">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground italic">
                    <Cog className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    Nenhuma peça encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const totalInv = Number(p.unit_cost) * Number(p.stock_quantity);
                  const isZero = Number(p.stock_quantity) === 0;
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <Cog size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors">
                              {p.name}
                            </p>
                            {p.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {p.sku || "—"}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                        {p.category || "—"}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-white whitespace-nowrap">
                        {formatCurrency(Number(p.unit_cost))}
                      </td>
                      <td className="p-4 text-center font-mono">
                        <span className={isZero ? "text-destructive font-bold" : "text-white"}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-primary whitespace-nowrap">
                        {formatCurrency(totalInv)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          className={`font-bold text-[10px] px-2 py-0.5 border-none ${
                            p.status === "ativo"
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.status === "ativo" ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      {canEdit && (
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full"
                              onClick={() => startEdit(p)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-9 w-9 rounded-full ${
                                p.status === "ativo"
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "text-success hover:bg-success/10"
                              }`}
                              onClick={() => toggleStatus(p)}
                              title={p.status === "ativo" ? "Inativar" : "Reativar"}
                            >
                              {p.status === "ativo" ? (
                                <PowerOff size={16} />
                              ) : (
                                <Power size={16} />
                              )}
                            </Button>
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
    </div>
  );
}
