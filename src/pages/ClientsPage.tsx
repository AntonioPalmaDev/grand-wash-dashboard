import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, User, Building2, Pencil } from "lucide-react";
import type { Client, ClientType } from "@/types";

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, getClientStats, getClientRate, config } = useApp();
  const { isDev } = useRole();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<ClientType>("PF");
  const [taxaCustom, setTaxaCustom] = useState("");
  const [cor, setCor] = useState("#a855f7"); 

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState<ClientType>("PF");
  const [editTaxa, setEditTaxa] = useState("");
  const [editCor, setEditCor] = useState("");

  const [filter, setFilter] = useState<"all" | ClientType>("all");
  const filtered = filter === "all" ? clients : clients.filter(c => c.tipo === filter);

  function handleAdd() {
    if (!nome.trim()) return;
    addClient({ 
      nome: nome.trim(), 
      tipo, 
      taxa: taxaCustom ? Number(taxaCustom) : 0, 
      cor 
    } as any);
    setNome(""); setTaxaCustom(""); setCor("#a855f7"); setOpen(false);
  }

  function handleStartEdit(client: Client) {
    setEditingClient(client);
    setEditNome(client.nome);
    setEditTipo(client.tipo);
    setEditTaxa(client.taxa > 0 ? String(client.taxa) : "");
    setEditCor(client.cor || "#a855f7");
  }

  async function handleUpdate() {
    if (!editingClient || !editNome.trim()) return;
    await updateClient(editingClient.id, {
      nome: editNome.trim(),
      tipo: editTipo,
      taxa: editTaxa ? Number(editTaxa) : 0,
      cor: editCor
    } as any);
    setEditingClient(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <Label>Nome</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Família Silva" />
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
              <div>
                <Label>Taxa (%)</Label>
                <Input type="number" value={taxaCustom} onChange={e => setTaxaCustom(e.target.value)} placeholder={`Padrão: ${tipo === "PF" ? config.taxaPF : config.taxaPJ}%`} />
              </div>
              <Button onClick={handleAdd} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {(["all", "PF", "PJ"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "secondary"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "Todos" : f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(client => {
          const s = getClientStats(client.id);
          const rate = getClientRate(client);
          const clientColor = client.cor || "#a855f7";

          return (
            <div key={client.id} className="glass-card rounded-xl p-5 space-y-4 border-l-4" style={{ borderLeftColor: clientColor }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-secondary/50" style={{ color: clientColor }}>
                    {client.tipo === "PF" ? <User size={18} /> : <Building2 size={18} />}
                  </div>
                  <span className="font-bold text-lg">{client.nome}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleStartEdit(client)} className="h-8 w-8"><Pencil size={14} /></Button>
                  {isDev && (
                    <Button variant="ghost" size="icon" onClick={() => deleteClient(client.id)} className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-secondary/20 p-2 rounded text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Ops</div>
                  <div className="font-mono font-bold text-lg">{s.totalOps}</div>
                </div>
                <div className="bg-secondary/20 p-2 rounded text-center col-span-2">
                  <div className="text-[10px] text-muted-foreground uppercase">Total Lavado</div>
                  <div className="font-mono font-bold text-lg text-emerald-400">{formatCurrency(s.totalLavado)}</div>
                </div>
              </div>

              <div className="space-y-1 text-xs pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro Gerado:</span>
                  <span className="font-semibold">{formatCurrency(s.lucroGerado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa:</span>
                  <span className="font-semibold">{formatPercent(rate)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE EDIÇÃO */}
<Dialog open={!!editingClient} onOpenChange={(o) => !o && setEditingClient(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar Cliente</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 pt-4">
      {/* NOME E COR */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <Label>Nome</Label>
          <Input 
            value={editNome} 
            onChange={e => setEditNome(e.target.value)} 
          />
        </div>
        <div className="col-span-1">
          <Label>Cor</Label>
          <Input 
            type="color" 
            value={editCor} 
            onChange={e => setEditCor(e.target.value)} 
            className="h-10 p-1 cursor-pointer" 
          />
        </div>
      </div>

      {/* TIPO (PF/PJ) */}
      <div>
        <Label>Tipo</Label>
        <Select value={editTipo} onValueChange={v => setEditTipo(v as ClientType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
            <SelectItem value="PJ">Empresa (PJ)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TAXA */}
      <div>
        <Label>Taxa (%)</Label>
        <Input 
          type="number" 
          value={editTaxa} 
          onChange={e => setEditTaxa(e.target.value)} 
          placeholder={`Padrão: ${editTipo === "PF" ? config.taxaPF : config.taxaPJ}%`} 
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => setEditingClient(null)} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleUpdate} className="flex-1">
          Salvar Alterações
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}