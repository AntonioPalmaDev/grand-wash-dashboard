import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/hooks/useRole";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { registrarLog } from "@/lib/logging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, ShoppingBag, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Weapon { id: string; name: string; sale_price: number; base_cost: number; status: string; }
interface ComponentRow {
  id: string; part_id: string; quantity: number; unit_cost_snapshot: number;
  weapon_parts?: { id: string; name: string; unit_cost: number } | null;
}
interface Sale {
  id: string; weapon_id: string; sale_value: number;
  base_cost_snapshot: number; parts_cost_snapshot: number;
  real_profit: number; real_margin: number;
  sold_at: string; responsavel: string | null;
  weapons?: { name: string } | null;
}

export default function WeaponSalesTab() {
  const { user, nomePersonagem } = useAuth();
  const { activeCompany } = useCompany();
  const { canEdit } = useRole();

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [weaponId, setWeaponId] = useState("");
  const [saleValue, setSaleValue] = useState("");
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [wRes, sRes] = await Promise.all([
      supabase.from("weapons").select("*").eq("status", "ativo").order("name"),
      supabase.from("weapon_sales").select("*, weapons(name)").order("sold_at", { ascending: false }).limit(100),
    ]);
    setWeapons((wRes.data || []) as Weapon[]);
    setSales((sRes.data || []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    async function loadComponents() {
      if (!weaponId) { setComponents([]); return; }
      const { data } = await supabase
        .from("weapon_components")
        .select("*, weapon_parts(id, name, unit_cost)")
        .eq("weapon_id", weaponId);
      setComponents((data || []) as any);
      const w = weapons.find((x) => x.id === weaponId);
      if (w) setSaleValue(String(w.sale_price));
    }
    loadComponents();
  }, [weaponId, weapons]);

  const weapon = weapons.find((w) => w.id === weaponId);
  const preview = useMemo(() => {
    const partsCost = components.reduce((acc, c) => acc + Number(c.unit_cost_snapshot) * Number(c.quantity), 0);
    const sale = Number(saleValue) || 0;
    const base = weapon ? Number(weapon.base_cost) : 0;
    const profit = sale - base - partsCost;
    const margin = sale > 0 ? (profit / sale) * 100 : 0;
    return { partsCost, sale, base, profit, margin };
  }, [components, saleValue, weapon]);

  const totals = useMemo(() => {
    const fat = sales.reduce((a, s) => a + Number(s.sale_value), 0);
    const lucro = sales.reduce((a, s) => a + Number(s.real_profit), 0);
    return { count: sales.length, fat, lucro };
  }, [sales]);

  function reset() {
    setWeaponId(""); setSaleValue(""); setComponents([]);
  }

  async function logSale(saleId: string, weaponName: string, profit: number) {
    if (!user) return;
    try {
      await registrarLog({
        userId: user.id, userEmail: user.email || "",
        nomePersonagem: nomePersonagem ?? null,
        companyId: activeCompany?.id ?? null,
        action: "venda", entity: "weapon_sales", entityId: saleId,
        description: `Venda de '${weaponName}' por ${formatCurrency(preview.sale)} (lucro real: ${formatCurrency(profit)}) registrada por ${nomePersonagem || user?.email}`,
      });
    } catch (e) { console.warn(e); }
  }

  async function handleSell() {
    if (!weaponId || !weapon) return toast.error("Selecione a arma");
    if (preview.sale <= 0) return toast.error("Valor de venda inválido");
    setSaving(true);
    try {
      const { data: sale, error } = await supabase.from("weapon_sales").insert({
        weapon_id: weaponId,
        company_id: activeCompany?.id ?? null,
        user_id: user?.id ?? null,
        responsavel: nomePersonagem || user?.email || null,
        sale_value: preview.sale,
        base_cost_snapshot: preview.base,
        parts_cost_snapshot: preview.partsCost,
        real_profit: preview.profit,
        real_margin: preview.margin,
      }).select().single();
      if (error) throw error;

      if (components.length > 0 && sale) {
        const snaps = components.map((c) => ({
          sale_id: sale.id,
          part_id: c.part_id,
          part_name_snapshot: c.weapon_parts?.name || "Peça",
          quantity_used: c.quantity,
          unit_cost_snapshot: Number(c.unit_cost_snapshot),
          total_cost_snapshot: Number(c.unit_cost_snapshot) * Number(c.quantity),
        }));
        await supabase.from("sale_component_snapshots").insert(snaps);
      }

      toast.success("Venda registrada");
      await logSale(sale!.id, weapon.name, preview.profit);
      setOpen(false); reset(); fetchAll();
    } catch (e: any) { toast.error(e.message || "Erro"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Vendas</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{totals.count}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Faturamento</p>
          <p className="text-2xl font-bold text-primary mt-1 font-mono">{formatCurrency(totals.fat)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lucro Real</p>
          <p className="text-2xl font-bold text-success mt-1 font-mono">{formatCurrency(totals.lucro)}</p>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="mr-2 h-4 w-4" /> Registrar Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] bg-secondary/95 border-white/10 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" /> Registrar Venda
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Arma / Produto</Label>
                  <Select value={weaponId} onValueChange={setWeaponId}>
                    <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {weapons.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor de Venda (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={saleValue} onChange={(e) => setSaleValue(e.target.value)} className="bg-background/50 border-white/10 font-mono" />
                </div>

                {weaponId && (
                  <div className="space-y-2 bg-background/30 p-3 rounded-lg border border-white/5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Peças vinculadas</p>
                    {components.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Nenhuma peça vinculada a esta arma.</p>
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {components.map((c) => (
                          <li key={c.id} className="flex justify-between text-white/80">
                            <span>{c.weapon_parts?.name} x{c.quantity}</span>
                            <span className="font-mono">{formatCurrency(Number(c.unit_cost_snapshot) * Number(c.quantity))}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="border-t border-white/10 pt-2 mt-2 grid grid-cols-2 gap-2 text-xs">
                      <span className="text-muted-foreground">Custo Base:</span>
                      <span className="text-right font-mono text-white">{formatCurrency(preview.base)}</span>
                      <span className="text-muted-foreground">Custo Peças:</span>
                      <span className="text-right font-mono text-amber-400">{formatCurrency(preview.partsCost)}</span>
                      <span className="text-muted-foreground font-bold">Lucro Real:</span>
                      <span className={`text-right font-mono font-bold ${preview.profit >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(preview.profit)}</span>
                      <span className="text-muted-foreground font-bold">Margem:</span>
                      <span className={`text-right font-mono font-bold ${preview.margin >= 0 ? "text-success" : "text-destructive"}`}>{formatPercent(preview.margin)}</span>
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={handleSell} disabled={saving || !weaponId} className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Venda
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground bg-white/5 font-bold uppercase text-[11px] tracking-widest">
                <th className="text-left p-4">Arma</th>
                <th className="text-right p-4">Valor</th>
                <th className="text-right p-4">Custo Peças</th>
                <th className="text-right p-4">Lucro Real</th>
                <th className="text-right p-4">Margem</th>
                <th className="text-left p-4">Responsável</th>
                <th className="text-left p-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground italic">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-20" />Nenhuma venda registrada.
                </td></tr>
              ) : sales.map((s) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="p-4 font-bold text-white">{s.weapons?.name || "—"}</td>
                  <td className="p-4 text-right font-mono text-white">{formatCurrency(Number(s.sale_value))}</td>
                  <td className="p-4 text-right font-mono text-amber-400">{formatCurrency(Number(s.parts_cost_snapshot))}</td>
                  <td className={`p-4 text-right font-mono font-bold ${Number(s.real_profit) >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(Number(s.real_profit))}
                  </td>
                  <td className={`p-4 text-right font-mono ${Number(s.real_margin) >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatPercent(Number(s.real_margin))}
                  </td>
                  <td className="p-4 text-muted-foreground">{s.responsavel || "—"}</td>
                  <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">{formatDate(s.sold_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
