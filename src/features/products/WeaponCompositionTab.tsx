import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/hooks/useRole";
import { formatCurrency, formatPercent } from "@/lib/format";
import { registrarLog } from "@/lib/logging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Weapon { id: string; name: string; sale_price: number; base_cost: number; }
interface Part { id: string; name: string; unit_cost: number; status: string; }
interface Component {
  id: string; weapon_id: string; part_id: string; quantity: number;
  unit_cost_snapshot: number;
  weapon_parts?: { name: string; unit_cost: number } | null;
}

export default function WeaponCompositionTab() {
  const { user, nomePersonagem } = useAuth();
  const { activeCompany } = useCompany();
  const { canEdit } = useRole();

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [selectedPart, setSelectedPart] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [adding, setAdding] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [wRes, pRes] = await Promise.all([
      supabase.from("weapons").select("id,name,sale_price,base_cost").order("name"),
      supabase.from("weapon_parts").select("id,name,unit_cost,status").eq("status", "ativo").order("name"),
    ]);
    setWeapons((wRes.data || []) as Weapon[]);
    setParts((pRes.data || []) as Part[]);
    setLoading(false);
  }, []);

  const fetchComponents = useCallback(async (weaponId: string) => {
    if (!weaponId) { setComponents([]); return; }
    const { data } = await supabase
      .from("weapon_components")
      .select("*, weapon_parts(name, unit_cost)")
      .eq("weapon_id", weaponId);
    setComponents((data || []) as any);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchComponents(selectedWeapon); }, [selectedWeapon, fetchComponents]);

  const weapon = weapons.find((w) => w.id === selectedWeapon);
  const totals = useMemo(() => {
    const partsCost = components.reduce(
      (acc, c) => acc + Number(c.unit_cost_snapshot) * Number(c.quantity), 0
    );
    const sale = weapon ? Number(weapon.sale_price) : 0;
    const base = weapon ? Number(weapon.base_cost) : 0;
    const profit = sale - base - partsCost;
    const margin = sale > 0 ? (profit / sale) * 100 : 0;
    return { partsCost, sale, base, profit, margin };
  }, [components, weapon]);

  async function logAction(action: string, entityId: string, description: string) {
    if (!user) return;
    try {
      await registrarLog({
        userId: user.id, userEmail: user.email || "",
        nomePersonagem: nomePersonagem ?? null,
        companyId: activeCompany?.id ?? null,
        action, entity: "weapon_components", entityId, description,
      });
    } catch (e) { console.warn(e); }
  }

  async function addComponent() {
    if (!selectedWeapon || !selectedPart) return toast.error("Selecione arma e peça");
    const qty = Number(quantity) || 1;
    const part = parts.find((p) => p.id === selectedPart);
    if (!part) return;
    setAdding(true);
    const { data, error } = await supabase.from("weapon_components").insert({
      weapon_id: selectedWeapon,
      part_id: selectedPart,
      quantity: qty,
      unit_cost_snapshot: Number(part.unit_cost),
    }).select().single();
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success("Peça vinculada");
    setSelectedPart(""); setQuantity("1");
    await logAction("vincular", data!.id, `Peça '${part.name}' x${qty} vinculada à arma '${weapon?.name}' por ${nomePersonagem || user?.email}`);
    fetchComponents(selectedWeapon);
  }

  async function removeComponent(c: Component) {
    if (!confirm("Remover peça da composição?")) return;
    await supabase.from("weapon_components").delete().eq("id", c.id);
    toast.success("Peça removida");
    await logAction("remover", c.id, `Peça removida da composição da arma '${weapon?.name}' por ${nomePersonagem || user?.email}`);
    fetchComponents(selectedWeapon);
  }

  return (
    <div className="space-y-6">
      <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 space-y-3">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Selecione a arma</Label>
        <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
          <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Escolha uma arma..." /></SelectTrigger>
          <SelectContent>
            {weapons.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} — {formatCurrency(Number(w.sale_price))}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedWeapon && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-4 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Preço de Venda</p>
              <p className="text-xl font-bold text-white mt-1 font-mono">{formatCurrency(totals.sale)}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Custo Peças</p>
              <p className="text-xl font-bold text-amber-400 mt-1 font-mono">{formatCurrency(totals.partsCost)}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lucro Real</p>
              <p className={`text-xl font-bold mt-1 font-mono ${totals.profit >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(totals.profit)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Margem Real</p>
              <p className={`text-xl font-bold mt-1 font-mono ${totals.margin >= 0 ? "text-success" : "text-destructive"}`}>
                {formatPercent(totals.margin)}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-[2fr,1fr,auto] gap-3 items-end">
              <div className="space-y-2">
                <Label>Peça</Label>
                <Select value={selectedPart} onValueChange={setSelectedPart}>
                  <SelectTrigger className="bg-background/50 border-white/10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {parts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.unit_cost))}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-background/50 border-white/10 font-mono" />
              </div>
              <Button onClick={addComponent} disabled={adding} className="bg-primary hover:bg-primary/90 text-white h-10">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Vincular</>}
              </Button>
            </div>
          )}

          <div className="glass-card rounded-xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground bg-white/5 font-bold uppercase text-[11px] tracking-widest">
                    <th className="text-left p-4">Peça</th>
                    <th className="text-center p-4">Qtd</th>
                    <th className="text-right p-4">Custo Unitário</th>
                    <th className="text-right p-4">Custo Total</th>
                    {canEdit && <th className="text-center p-4">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></td></tr>
                  ) : components.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-20" />Nenhuma peça vinculada.
                    </td></tr>
                  ) : components.map((c) => {
                    const cost = Number(c.unit_cost_snapshot);
                    const total = cost * Number(c.quantity);
                    return (
                      <tr key={c.id} className="hover:bg-white/5">
                        <td className="p-4 font-bold text-white">{c.weapon_parts?.name || "—"}</td>
                        <td className="p-4 text-center font-mono text-white">{c.quantity}</td>
                        <td className="p-4 text-right font-mono text-white">{formatCurrency(cost)}</td>
                        <td className="p-4 text-right font-mono font-bold text-primary">{formatCurrency(total)}</td>
                        {canEdit && (
                          <td className="p-4 text-center">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeComponent(c)}>
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        )}
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
