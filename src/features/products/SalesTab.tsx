import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { registrarLog } from "@/lib/logging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, ShoppingBag, Trash2, Pencil, Eye, X, Search, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSales, Sale } from "./useSales";

interface Weapon { id: string; name: string; sale_price: number; base_cost: number; status: string; }
interface ComponentRow {
  id: string; part_id: string; quantity: number; unit_cost_snapshot: number;
  weapon_parts?: { id: string; name: string; unit_cost: number } | null;
}

interface DraftItem {
  key: string;
  weaponId: string;
  weaponName: string;
  quantity: number;
  unitPrice: number;
  baseCost: number;
  partsCostUnit: number;
  components: ComponentRow[];
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  concluido: { label: "Concluído", cls: "bg-success/20 text-success border-success/30" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/20 text-destructive border-destructive/30" },
};

export default function SalesTab() {
  const { user, nomePersonagem } = useAuth();
  const { activeCompany } = useCompany();
  const { clients } = useApp();
  const { canEdit, isDev, isAdmin } = useRole();
  const { sales, loading, stats, refetch } = useSales();

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientId, setClientId] = useState<string>("none");
  const [status, setStatus] = useState<"pendente" | "concluido" | "cancelado">("pendente");
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);

  useEffect(() => {
    supabase.from("weapons").select("*").eq("status", "ativo").order("name")
      .then(({ data }) => setWeapons((data || []) as Weapon[]));
  }, []);

  function resetForm() {
    setClientId("none"); setStatus("pendente"); setSaleDate(new Date().toISOString().slice(0, 16));
    setNotes(""); setItems([]); setEditing(null);
  }

  // Open edit modal: load draft items from sale
  const openEdit = useCallback(async (s: Sale) => {
    setEditing(s);
    setClientId(s.client_id || "none");
    setStatus(s.status);
    setSaleDate(new Date(s.sale_date).toISOString().slice(0, 16));
    setNotes(s.notes || "");
    const drafts: DraftItem[] = (s.sale_items || []).map((it) => ({
      key: it.id,
      weaponId: it.product_id,
      weaponName: it.product_name_snapshot,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_sale_price),
      baseCost: Number(it.base_cost_snapshot) / Math.max(Number(it.quantity), 1),
      partsCostUnit: Number(it.parts_cost_snapshot) / Math.max(Number(it.quantity), 1),
      components: (it.sale_item_components || []).map((c) => ({
        id: c.id, part_id: c.part_id || "", quantity: Number(c.quantity_used),
        unit_cost_snapshot: Number(c.unit_cost_snapshot),
        weapon_parts: { id: c.part_id || "", name: c.part_name_snapshot, unit_cost: Number(c.unit_cost_snapshot) },
      })),
    }));
    setItems(drafts);
    setOpen(true);
  }, []);

  async function addItemRow() {
    setItems((prev) => [...prev, {
      key: crypto.randomUUID(), weaponId: "", weaponName: "", quantity: 1,
      unitPrice: 0, baseCost: 0, partsCostUnit: 0, components: [],
    }]);
  }

  async function selectWeaponForRow(rowKey: string, weaponId: string) {
    const w = weapons.find((x) => x.id === weaponId);
    if (!w) return;
    const { data } = await supabase
      .from("weapon_components")
      .select("*, weapon_parts(id, name, unit_cost)")
      .eq("weapon_id", weaponId);
    const comps = (data || []) as any as ComponentRow[];
    const partsCostUnit = comps.reduce((a, c) => a + Number(c.unit_cost_snapshot) * Number(c.quantity), 0);
    setItems((prev) => prev.map((it) => it.key === rowKey ? ({
      ...it, weaponId, weaponName: w.name, unitPrice: Number(w.sale_price),
      baseCost: Number(w.base_cost), partsCostUnit, components: comps,
    }) : it));
  }

  function updateRow(key: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it) => it.key === key ? { ...it, ...patch } : it));
  }
  function removeRow(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  const totals = useMemo(() => {
    let sale = 0, base = 0, parts = 0;
    for (const it of items) {
      sale += it.unitPrice * it.quantity;
      base += it.baseCost * it.quantity;
      parts += it.partsCostUnit * it.quantity;
    }
    const profit = sale - base - parts;
    const margin = sale > 0 ? (profit / sale) * 100 : 0;
    return { sale, base, parts, profit, margin };
  }, [items]);

  async function handleSave() {
    if (items.length === 0) return toast.error("Adicione ao menos um item");
    if (items.some((i) => !i.weaponId)) return toast.error("Selecione o produto em todos os itens");
    if (items.some((i) => i.quantity <= 0)) return toast.error("Quantidade inválida");
    setSaving(true);
    try {
      const clientName = clientId !== "none" ? (clients.find(c => c.id === clientId)?.nome || null) : null;
      const payload = {
        company_id: activeCompany?.id ?? null,
        client_id: clientId !== "none" ? clientId : null,
        client_name_snapshot: clientName,
        status, sale_date: new Date(saleDate).toISOString(),
        notes: notes.trim() || null,
        total_sale_value: totals.sale,
        total_base_cost: totals.base,
        total_parts_cost: totals.parts,
        real_profit: totals.profit,
        real_margin: totals.margin,
      };

      let saleId: string;
      if (editing) {
        const { data: upd, error } = await supabase
          .from("sales")
          .update(payload)
          .eq("id", editing.id)
          .select("id");
        if (error) throw error;
        if (!upd || upd.length === 0) throw new Error("Sem permissão para editar esta venda.");
        saleId = editing.id;
        // Wipe old items (cascade removes components)
        await supabase.from("sale_items").delete().eq("sale_id", saleId);
      } else {
        const { data, error } = await supabase.from("sales").insert({
          ...payload, created_by: user!.id,
          created_by_email: user?.email || null,
          created_by_name: nomePersonagem || user?.email || null,
        }).select().single();
        if (error) throw error;
        saleId = data!.id;
      }

      // Insert items + components
      for (const it of items) {
        const itemRow = {
          sale_id: saleId, product_id: it.weaponId,
          product_name_snapshot: it.weaponName,
          quantity: it.quantity,
          unit_sale_price: it.unitPrice,
          total_sale_price: it.unitPrice * it.quantity,
          base_cost_snapshot: it.baseCost * it.quantity,
          parts_cost_snapshot: it.partsCostUnit * it.quantity,
          real_profit: (it.unitPrice - it.baseCost - it.partsCostUnit) * it.quantity,
          real_margin: it.unitPrice > 0 ? ((it.unitPrice - it.baseCost - it.partsCostUnit) / it.unitPrice) * 100 : 0,
        };
        const { data: ins, error: e1 } = await supabase.from("sale_items").insert(itemRow).select().single();
        if (e1) throw e1;
        if (it.components.length > 0) {
          await supabase.from("sale_item_components").insert(
            it.components.map((c) => ({
              sale_item_id: ins!.id,
              part_id: c.part_id || null,
              part_name_snapshot: c.weapon_parts?.name || "Peça",
              quantity_used: Number(c.quantity) * it.quantity,
              unit_cost_snapshot: Number(c.unit_cost_snapshot),
              total_cost_snapshot: Number(c.unit_cost_snapshot) * Number(c.quantity) * it.quantity,
            }))
          );
        }
      }

      // Log
      try {
        await registrarLog({
          userId: user!.id, userEmail: user?.email || "",
          nomePersonagem: nomePersonagem ?? null,
          companyId: activeCompany?.id ?? null,
          action: editing ? "venda_editada" : "venda",
          entity: "sales", entityId: saleId,
          description: `${editing ? "Editou" : "Registrou"} venda de ${items.length} item(ns) para ${clientName || "cliente avulso"} • Total ${formatCurrency(totals.sale)} • Lucro ${formatCurrency(totals.profit)} • Status ${status}`,
        });
      } catch (e) { console.warn(e); }

      toast.success(editing ? "Venda atualizada" : "Venda registrada");
      setOpen(false); resetForm(); refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar venda");
    } finally { setSaving(false); }
  }

  async function changeStatus(sale: Sale, newStatus: "pendente" | "concluido" | "cancelado") {
    const { data, error } = await supabase
      .from("sales")
      .update({ status: newStatus })
      .eq("id", sale.id)
      .select("id");
    if (error) return toast.error(error.message);
    if (!data || data.length === 0) {
      return toast.error("Sem permissão para alterar esta venda.");
    }
    try {
      await registrarLog({
        userId: user!.id, userEmail: user?.email || "",
        nomePersonagem: nomePersonagem ?? null,
        companyId: activeCompany?.id ?? null,
        action: "venda_status", entity: "sales", entityId: sale.id,
        description: `Status da venda alterado de '${sale.status}' para '${newStatus}'`,
      });
    } catch {}
    toast.success("Status atualizado");
    await refetch();
  }

  async function deleteSale(sale: Sale) {
    if (!confirm("Excluir esta venda? Esta ação é irreversível.")) return;
    const { error } = await supabase.from("sales").update({ deleted_at: new Date().toISOString() }).eq("id", sale.id);
    if (error) return toast.error(error.message);
    try {
      await registrarLog({
        userId: user!.id, userEmail: user?.email || "",
        nomePersonagem: nomePersonagem ?? null,
        companyId: activeCompany?.id ?? null,
        action: "venda_excluida", entity: "sales", entityId: sale.id,
        description: `Venda excluída • Cliente ${sale.client_name_snapshot || "—"} • Total ${formatCurrency(Number(sale.total_sale_value))}`,
      });
    } catch {}
    toast.success("Venda excluída"); refetch();
  }

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchClient = (s.client_name_snapshot || "").toLowerCase().includes(q);
        const matchResp = (s.created_by_name || "").toLowerCase().includes(q);
        const matchItem = (s.sale_items || []).some(it => it.product_name_snapshot.toLowerCase().includes(q));
        if (!matchClient && !matchResp && !matchItem) return false;
      }
      return true;
    });
  }, [sales, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Vendido" value={formatCurrency(stats.totalVendido)} color="text-primary" />
        <KpiCard label="Lucro Real" value={formatCurrency(stats.lucroReal)} color="text-success" />
        <KpiCard label="Ticket Médio" value={formatCurrency(stats.ticketMedio)} color="text-white" />
        <KpiCard label="Margem Média" value={formatPercent(stats.margemMedia)} color="text-emerald-400" />
        <KpiCard label="Concluídas" value={String(stats.concluidas)} color="text-success" />
        <KpiCard label="Pendentes" value={String(stats.pendentes)} color="text-amber-400" />
        <KpiCard label="Canceladas" value={String(stats.canceladas)} color="text-destructive" />
        <KpiCard label="Total" value={String(stats.total)} color="text-white" />
      </div>

      {/* Filters + Action */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-secondary/20 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, produto ou responsável..." className="pl-9 bg-background/50 border-white/10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-48 bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="mr-2 h-4 w-4" /> Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[820px] bg-secondary/95 border-white/10 backdrop-blur-xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" /> {editing ? "Editar Venda" : "Nova Venda"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5 md:col-span-1">
                    <Label className="text-xs">Cliente</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Cliente avulso —</SelectItem>
                        {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                      <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data da Venda</Label>
                    <Input type="datetime-local" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="bg-background/50 border-white/10" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas..." className="bg-background/50 border-white/10 min-h-[60px]" />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Itens da venda</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addItemRow} className="h-7 text-xs border-white/10">
                      <Plus className="h-3 w-3 mr-1" /> Adicionar item
                    </Button>
                  </div>
                  {items.length === 0 && (
                    <p className="text-xs italic text-muted-foreground py-4 text-center bg-background/30 rounded-lg border border-dashed border-white/10">
                      Nenhum item — adicione ao menos um produto/arma.
                    </p>
                  )}
                  <div className="space-y-2">
                    {items.map((it) => {
                      const sub = it.unitPrice * it.quantity;
                      const profit = (it.unitPrice - it.baseCost - it.partsCostUnit) * it.quantity;
                      return (
                        <div key={it.key} className="bg-background/40 border border-white/5 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 md:col-span-5 space-y-1">
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Produto / Arma</Label>
                              <Select value={it.weaponId} onValueChange={(v) => selectWeaponForRow(it.key, v)}>
                                <SelectTrigger className="bg-background/50 border-white/10 h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                  {weapons.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-4 md:col-span-2 space-y-1">
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Qtd</Label>
                              <Input type="number" min="1" value={it.quantity} onChange={(e) => updateRow(it.key, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="bg-background/50 border-white/10 h-9 font-mono" />
                            </div>
                            <div className="col-span-4 md:col-span-2 space-y-1">
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Vlr. Unit.</Label>
                              <Input type="number" min="0" step="0.01" value={it.unitPrice} onChange={(e) => updateRow(it.key, { unitPrice: Number(e.target.value) || 0 })} className="bg-background/50 border-white/10 h-9 font-mono" />
                            </div>
                            <div className="col-span-3 md:col-span-2 space-y-1">
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Subtotal</Label>
                              <p className="h-9 px-2 flex items-center font-mono text-sm text-white font-bold">{formatCurrency(sub)}</p>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(it.key)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {it.weaponId && (
                            <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-white/5">
                              <div>
                                <p className="text-muted-foreground">Custo Base</p>
                                <p className="font-mono text-white">{formatCurrency(it.baseCost * it.quantity)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Custo Peças ({it.components.length})</p>
                                <p className="font-mono text-amber-400">{formatCurrency(it.partsCostUnit * it.quantity)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Lucro</p>
                                <p className={`font-mono font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(profit)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-background/40 border border-white/10 rounded-lg p-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <Total label="Total Venda" value={formatCurrency(totals.sale)} cls="text-primary" />
                  <Total label="Custo Base" value={formatCurrency(totals.base)} cls="text-white" />
                  <Total label="Custo Peças" value={formatCurrency(totals.parts)} cls="text-amber-400" />
                  <Total label="Lucro Real" value={formatCurrency(totals.profit)} cls={totals.profit >= 0 ? "text-success" : "text-destructive"} />
                  <Total label="Margem" value={formatPercent(totals.margin)} cls={totals.margin >= 0 ? "text-success" : "text-destructive"} />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Salvar alterações" : "Registrar Venda"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground bg-white/5 font-bold uppercase text-[11px] tracking-widest">
                <th className="text-left p-4">Data</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-center p-4">Status</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">Peças</th>
                <th className="text-right p-4">Lucro Real</th>
                <th className="text-right p-4">Margem</th>
                <th className="text-left p-4">Responsável</th>
                <th className="text-center p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={9} className="p-12 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-12 text-center text-muted-foreground italic">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-20" />Nenhuma venda registrada.
                </td></tr>
              ) : filtered.map((s) => {
                const isOwner = s.created_by === user?.id;
                const canEditSale = isOwner || isAdmin;
                return (
                  <tr key={s.id} className="hover:bg-white/5">
                    <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">{formatDate(s.sale_date)}</td>
                    <td className="p-4 font-bold text-white">{s.client_name_snapshot || <span className="text-muted-foreground italic font-normal">—</span>}</td>
                    <td className="p-4 text-center">
                      <Badge className={`text-[10px] border ${STATUS_META[s.status].cls}`}>{STATUS_META[s.status].label}</Badge>
                    </td>
                    <td className="p-4 text-right font-mono text-white">{formatCurrency(Number(s.total_sale_value))}</td>
                    <td className="p-4 text-right font-mono text-amber-400">{formatCurrency(Number(s.total_parts_cost))}</td>
                    <td className={`p-4 text-right font-mono font-bold ${Number(s.real_profit) >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(Number(s.real_profit))}
                    </td>
                    <td className={`p-4 text-right font-mono ${Number(s.real_margin) >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatPercent(Number(s.real_margin))}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{s.created_by_name || "—"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(s)} title="Detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditSale && s.status !== "cancelado" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => openEdit(s)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canEditSale && s.status !== "cancelado" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-400 hover:bg-amber-500/10" onClick={() => changeStatus(s, "cancelado")} title="Cancelar">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {canEditSale && s.status === "pendente" && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:bg-success/10" onClick={() => changeStatus(s, "concluido")} title="Concluir">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {isDev && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteSale(s)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
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

      {/* Details modal */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="sm:max-w-[720px] bg-secondary/95 border-white/10 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Detalhes da Venda
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Info label="Cliente" value={viewing.client_name_snapshot || "—"} />
                <Info label="Status" value={STATUS_META[viewing.status].label} />
                <Info label="Data" value={formatDate(viewing.sale_date)} />
                <Info label="Responsável" value={viewing.created_by_name || "—"} />
              </div>
              {viewing.notes && (
                <div className="bg-background/30 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Observações</p>
                  <p className="text-white/80 text-sm">{viewing.notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Itens</p>
                {(viewing.sale_items || []).map((it) => (
                  <div key={it.id} className="bg-background/40 border border-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white">{it.product_name_snapshot}</p>
                        <p className="text-xs text-muted-foreground">Qtd {it.quantity} × {formatCurrency(Number(it.unit_sale_price))}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-white">{formatCurrency(Number(it.total_sale_price))}</p>
                        <p className={`text-xs font-mono ${Number(it.real_profit) >= 0 ? "text-success" : "text-destructive"}`}>
                          Lucro {formatCurrency(Number(it.real_profit))} ({formatPercent(Number(it.real_margin))})
                        </p>
                      </div>
                    </div>
                    {(it.sale_item_components || []).length > 0 && (
                      <ul className="mt-2 pt-2 border-t border-white/5 space-y-0.5">
                        {it.sale_item_components!.map((c) => (
                          <li key={c.id} className="flex justify-between text-[11px] text-muted-foreground">
                            <span>↳ {c.part_name_snapshot} x{Number(c.quantity_used)}</span>
                            <span className="font-mono text-amber-400">{formatCurrency(Number(c.total_cost_snapshot))}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/5">
                <Info label="Total" value={formatCurrency(Number(viewing.total_sale_value))} />
                <Info label="Custo Peças" value={formatCurrency(Number(viewing.total_parts_cost))} />
                <Info label="Lucro Real" value={formatCurrency(Number(viewing.real_profit))} />
                <Info label="Margem" value={formatPercent(Number(viewing.real_margin))} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-3 border border-white/10">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-1 font-mono ${color}`}>{value}</p>
    </div>
  );
}

function Total({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-mono font-bold ${cls}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-mono text-white text-sm font-bold">{value}</p>
    </div>
  );
}
