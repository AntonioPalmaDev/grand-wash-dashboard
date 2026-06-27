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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Loader2, Pencil, Plus, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

export interface Weapon {
  id: string;
  name: string;
  sale_price: number;
  base_cost: number;
  status: "ativo" | "inativo";
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function WeaponsTab() {
  const { user, nomePersonagem } = useAuth();
  const { activeCompany } = useCompany();
  const { canEdit } = useRole();

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Weapon | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [baseCost, setBaseCost] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [description, setDescription] = useState("");

  const fetchWeapons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("weapons").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar armas");
    else setWeapons((data || []) as Weapon[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWeapons(); }, [fetchWeapons]);

  function reset() {
    setName(""); setSalePrice(""); setBaseCost("");
    setStatus("ativo"); setDescription(""); setEditing(null);
  }

  function startEdit(w: Weapon) {
    setEditing(w);
    setName(w.name);
    setSalePrice(String(w.sale_price));
    setBaseCost(String(w.base_cost));
    setStatus(w.status);
    setDescription(w.description || "");
    setOpen(true);
  }

  async function logAction(action: string, entityId: string, description: string) {
    if (!user) return;
    try {
      await registrarLog({
        userId: user.id, userEmail: user.email || "",
        nomePersonagem: nomePersonagem ?? null,
        companyId: activeCompany?.id ?? null,
        action, entity: "weapons", entityId, description,
      });
    } catch (e) { console.warn(e); }
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    const payload = {
      name: name.trim(),
      sale_price: Number(salePrice) || 0,
      base_cost: Number(baseCost) || 0,
      status,
      description: description.trim() || null,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("weapons").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Arma atualizada");
        await logAction("editar", editing.id, `Arma '${payload.name}' editada por ${nomePersonagem || user?.email}`);
      } else {
        const { data, error } = await supabase.from("weapons").insert(payload).select().single();
        if (error) throw error;
        toast.success("Arma cadastrada");
        await logAction("criar", data!.id, `Arma '${payload.name}' cadastrada por ${nomePersonagem || user?.email}`);
      }
      setOpen(false); reset(); fetchWeapons();
    } catch (e: any) { toast.error(e.message || "Erro"); }
    finally { setSaving(false); }
  }

  async function toggleStatus(w: Weapon) {
    const next = w.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("weapons").update({ status: next }).eq("id", w.id);
    if (error) return toast.error("Erro");
    toast.success(next === "ativo" ? "Reativada" : "Inativada");
    fetchWeapons();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-secondary/20 p-4 rounded-xl border border-white/5">
        <p className="text-sm text-muted-foreground flex-1">Catálogo de armas e produtos vendáveis. Configure preço de venda e custo base.</p>
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="mr-2 h-4 w-4" /> Nova Arma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] bg-secondary/95 border-white/10 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{editing ? "Editar Arma" : "Cadastrar Arma"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: AK-47" className="bg-background/50 border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço de Venda (R$)</Label>
                    <Input type="number" min="0" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="bg-background/50 border-white/10 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>Custo Base (R$)</Label>
                    <Input type="number" min="0" step="0.01" value={baseCost} onChange={(e) => setBaseCost(e.target.value)} className="bg-background/50 border-white/10 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                    <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativa</SelectItem>
                      <SelectItem value="inativo">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-background/50 border-white/10" />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground bg-white/5 font-bold uppercase text-[11px] tracking-widest">
                <th className="text-left p-4">Arma</th>
                <th className="text-right p-4">Preço de Venda</th>
                <th className="text-right p-4">Custo Base</th>
                <th className="text-center p-4">Status</th>
                {canEdit && <th className="text-center p-4">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></td></tr>
              ) : weapons.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                  <Swords className="h-8 w-8 mx-auto mb-2 opacity-20" />Nenhuma arma cadastrada.
                </td></tr>
              ) : (
                weapons.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Swords size={18} /></div>
                        <div>
                          <p className="font-bold text-white">{w.name}</p>
                          {w.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{w.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono font-black text-white">{formatCurrency(Number(w.sale_price))}</td>
                    <td className="p-4 text-right font-mono text-muted-foreground">{formatCurrency(Number(w.base_cost))}</td>
                    <td className="p-4 text-center">
                      <Badge className={`font-bold text-[10px] px-2 py-0.5 border-none ${w.status === "ativo" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                        {w.status === "ativo" ? "Ativa" : "Inativa"}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full" onClick={() => startEdit(w)}>
                            <Pencil size={16} />
                          </Button>
                          <Button variant="ghost" size="icon"
                            className={`h-9 w-9 rounded-full ${w.status === "ativo" ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10"}`}
                            onClick={() => toggleStatus(w)}>
                            {w.status === "ativo" ? <PowerOff size={16} /> : <Power size={16} />}
                          </Button>
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
