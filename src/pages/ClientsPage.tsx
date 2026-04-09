import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, User, Building2 } from "lucide-react";
import type { ClientType } from "@/types";

export default function ClientsPage() {
  const { clients, addClient, deleteClient, getClientStats, getClientRate, config } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | ClientType>("all");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<ClientType>("PF");
  const [taxaCustom, setTaxaCustom] = useState("");

  const filtered = filter === "all" ? clients : clients.filter(c => c.tipo === filter);

  function handleAdd() {
    if (!nome.trim()) return;
    addClient({ nome: nome.trim(), tipo, taxa: taxaCustom ? Number(taxaCustom) : 0 });
    setNome(""); setTaxaCustom(""); setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={v => setTipo(v as ClientType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">PF - Pessoa Física</SelectItem>
                    <SelectItem value="PJ">PJ - Facção/Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taxa Personalizada (%) <span className="text-muted-foreground">- opcional</span></Label>
                <Input type="number" value={taxaCustom} onChange={e => setTaxaCustom(e.target.value)} placeholder={`Padrão: ${tipo === "PF" ? config.taxaPF : config.taxaPJ}%`} />
              </div>
              <Button onClick={handleAdd} className="w-full">Cadastrar</Button>
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

      {filtered.length === 0 ? (
        <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">Nenhum cliente cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => {
            const s = getClientStats(client.id);
            const rate = getClientRate(client);
            return (
              <div key={client.id} className="glass-card rounded-lg p-5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {client.tipo === "PF" ? <User className="h-4 w-4 text-info" /> : <Building2 className="h-4 w-4 text-warning" />}
                    <span className="font-semibold">{client.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={client.tipo === "PF" ? "default" : "secondary"}>{client.tipo}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteClient(client.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Taxa: {formatPercent(rate)}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-secondary/30 rounded p-2"><div className="text-xs text-muted-foreground">Total Lavado</div><div className="font-mono font-semibold">{formatCurrency(s.totalLavado)}</div></div>
                  <div className="bg-secondary/30 rounded p-2"><div className="text-xs text-muted-foreground">Operações</div><div className="font-mono font-semibold">{s.totalOps}</div></div>
                  <div className="bg-secondary/30 rounded p-2"><div className="text-xs text-muted-foreground">Lucro Gerado</div><div className="font-mono font-semibold">{formatCurrency(s.lucroGerado)}</div></div>
                  <div className="bg-secondary/30 rounded p-2"><div className="text-xs text-muted-foreground">Média/Op</div><div className="font-mono font-semibold">{formatCurrency(s.mediaPorOp)}</div></div>
                </div>
                {s.ultimaAtividade && <div className="text-xs text-muted-foreground">Última atividade: {formatDate(s.ultimaAtividade)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
