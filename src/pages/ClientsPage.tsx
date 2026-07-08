import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { useSales } from "@/features/products/useSales";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, User, Building2, Pencil, Search, Loader2 } from "lucide-react";
import type { Client, ClientType } from "@/types";

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useApp();
  const { isDev, canEdit } = useRole();
  const { sales } = useSales();

  // create
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<ClientType>("PF");
  const [cor, setCor] = useState("#a855f7");
  const [saving, setSaving] = useState(false);

  // edit
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState<ClientType>("PF");
  const [editCor, setEditCor] = useState("");
  const [updating, setUpdating] = useState(false);

  // delete
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  // filters
  const [filter, setFilter] = useState<"all" | ClientType>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter(c => {
      if (filter !== "all" && c.tipo !== filter) return false;
      if (q && !c.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [clients, filter, search]);

  // Sales stats per client (matches by id or by snapshot name, only concluded)
  const salesStatsByClient = useMemo(() => {
    const map = new Map<string, {
      totalVendido: number;
      lucroReal: number;
      custoPecas: number;
      qtdVendas: number;
      qtdArmas: number;
      ultimaVenda: string | null;
    }>();
    const concluded = sales.filter(s => s.status === "concluido");
    for (const c of clients) {
      const nameLower = c.nome.trim().toLowerCase();
      const related = concluded.filter(s =>
        (s.client_id && s.client_id === c.id) ||
        (!s.client_id && (s.client_name_snapshot || "").trim().toLowerCase() === nameLower)
      );
      const totalVendido = related.reduce((a, s) => a + Number(s.total_sale_value || 0), 0);
      const lucroReal = related.reduce((a, s) => a + Number(s.real_profit || 0), 0);
      const custoPecas = related.reduce((a, s) => a + Number(s.total_parts_cost || 0), 0);
      const qtdArmas = related.reduce(
        (a, s) => a + (s.sale_items || []).reduce((n, it) => n + Number(it.quantity || 0), 0),
        0,
      );
      const ultimaVenda = related
        .map(s => s.sale_date)
        .sort()
        .reverse()[0] || null;
      map.set(c.id, { totalVendido, lucroReal, custoPecas, qtdVendas: related.length, qtdArmas, ultimaVenda });
    }
    return map;
  }, [sales, clients]);

  function resetCreate() {
    setNome(""); setTipo("PF"); setCor("#a855f7");
  }

  async function handleAdd() {
    if (!nome.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome do cliente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addClient({ nome: nome.trim(), tipo, taxa: 0, cor } as any);
      toast({ title: "Cliente criado", description: nome.trim() });
      resetCreate();
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao criar cliente", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(client: Client) {
    setEditingClient(client);
    setEditNome(client.nome);
    setEditTipo(client.tipo);
    setEditCor(client.cor || "#a855f7");
  }

  async function handleUpdate() {
    if (!editingClient) return;
    if (!editNome.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      await updateClient(editingClient.id, {
        nome: editNome.trim(),
        tipo: editTipo,
        cor: editCor,
      } as any);
      toast({ title: "Cliente atualizado", description: editNome.trim() });
      setEditingClient(null);
    } catch (e: any) {
      toast({ title: "Erro ao atualizar", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteClient(confirmDelete.id);
      toast({ title: "Cliente excluído", description: confirmDelete.nome });
      setConfirmDelete(null);
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Gestão de Clientes</h1>
        {canEdit && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetCreate(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
              <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Label>Nome *</Label>
                    <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" />
                  </div>
                  <div className="col-span-1">
                    <Label>Cor</Label>
                    <Input type="color" value={cor} onChange={e => setCor(e.target.value)} className="h-10 p-1 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={v => setTipo(v as ClientType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                      <SelectItem value="PJ">Empresa (PJ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex gap-2">
          {(["all", "PF", "PJ"] as const).map(f => (
            <Button key={f} variant={filter === f ? "default" : "secondary"} size="sm" onClick={() => setFilter(f)}>
              {f === "all" ? "Todos" : f}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          Nenhum cliente encontrado.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map(client => {
          const s = salesStatsByClient.get(client.id) ?? {
            totalVendido: 0, lucroReal: 0, custoPecas: 0, qtdVendas: 0, qtdArmas: 0, ultimaVenda: null,
          };
          const clientColor = client.cor || "#a855f7";

          return (
            <div key={client.id} className="glass-card rounded-xl p-5 space-y-4 border-l-4" style={{ borderLeftColor: clientColor }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-secondary/50" style={{ color: clientColor }}>
                    {client.tipo === "PF" ? <User size={18} /> : <Building2 size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-tight">{client.nome}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{client.tipo}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {canEdit && <Button variant="ghost" size="icon" onClick={() => handleStartEdit(client)} className="h-8 w-8"><Pencil size={14} /></Button>}
                  {isDev && (
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(client)} className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary/20 p-2 rounded text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Vendas</div>
                  <div className="font-mono font-bold text-lg">{s.qtdVendas}</div>
                </div>
                <div className="bg-secondary/20 p-2 rounded text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Armas</div>
                  <div className="font-mono font-bold text-lg">{s.qtdArmas}</div>
                </div>
                <div className="bg-secondary/20 p-2 rounded text-center col-span-2">
                  <div className="text-[10px] text-muted-foreground uppercase">Total Vendido</div>
                  <div className="font-mono font-bold text-lg text-emerald-400">{formatCurrency(s.totalVendido)}</div>
                </div>
              </div>

              <div className="space-y-1 text-xs pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro Real:</span>
                  <span className="font-semibold text-emerald-300">{formatCurrency(s.lucroReal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo Peças:</span>
                  <span className="font-semibold">{formatCurrency(s.custoPecas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última venda:</span>
                  <span className="font-semibold">
                    {s.ultimaVenda ? new Date(s.ultimaVenda).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={!!editingClient} onOpenChange={(o) => !o && setEditingClient(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label>Nome *</Label>
                <Input value={editNome} onChange={e => setEditNome(e.target.value)} />
              </div>
              <div className="col-span-1">
                <Label>Cor</Label>
                <Input type="color" value={editCor} onChange={e => setEditCor(e.target.value)} className="h-10 p-1 cursor-pointer" />
              </div>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={editTipo} onValueChange={v => setEditTipo(v as ClientType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                  <SelectItem value="PJ">Empresa (PJ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingClient(null)} className="flex-1" disabled={updating}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} className="flex-1" disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAR EXCLUSÃO */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && !deleting && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá arquivar o cliente <b>{confirmDelete?.nome}</b>.
              As vendas já registradas permanecem no histórico com o nome do cliente preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
