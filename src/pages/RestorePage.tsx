import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import {
  registrarLog,
  logRestaurarOperacao,
  logRestaurarCliente,
  logReverterEdicao,
} from "@/lib/logging";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";

interface DeletedOperation {
  id: string;
  client_id: string;
  valor_bruto: number;
  status: string;
  responsavel: string;
  deleted_at: string;
  data: string;
}
interface DeletedClient {
  id: string;
  nome: string;
  tipo: string;
  taxa: number;
  cor: string | null;
  deleted_at: string;
}
interface UpdateLog {
  id: string;
  user_email: string | null;
  nome_personagem: string | null;
  entity: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

export default function RestorePage() {
  const { user, nomePersonagem } = useAuth();
  const { isDev, loading: roleLoading } = useRole();

  const [deletedOps, setDeletedOps] = useState<DeletedOperation[]>([]);
  const [deletedClients, setDeletedClients] = useState<DeletedClient[]>([]);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [opsRes, cliRes, logsRes, allClientsRes] = await Promise.all([
      supabase.from("operations").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("clients").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("audit_logs").select("*").eq("action", "editar").order("created_at", { ascending: false }).limit(100),
      supabase.from("clients").select("id, nome"),
    ]);
    if (opsRes.data) setDeletedOps(opsRes.data as any);
    if (cliRes.data) setDeletedClients(cliRes.data as any);
    if (logsRes.data) setUpdateLogs(logsRes.data as any);
    if (allClientsRes.data) {
      const map: Record<string, string> = {};
      (allClientsRes.data as any[]).forEach(c => { map[c.id] = c.nome; });
      setClientNames(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDev) fetchAll();
  }, [isDev, fetchAll]);

  const logBase = () => ({
    userId: user?.id ?? "",
    userEmail: user?.email ?? "",
    nomePersonagem: nomePersonagem ?? null,
  });

  async function restoreOperation(op: DeletedOperation) {
    const { error } = await supabase.from("operations").update({ deleted_at: null }).eq("id", op.id);
    if (error) { toast.error("Erro ao restaurar operação"); return; }
    const desc = logRestaurarOperacao({ responsavel: nomePersonagem || user?.email || "Sistema", nomeCliente: clientNames[op.client_id] || "---" });
    await registrarLog({ ...logBase(), action: "restaurar", entity: "operação", entityId: op.id, description: desc, afterData: { restaurado: true } });
    toast.success("Operação restaurada");
    fetchAll();
  }

  async function restoreClient(c: DeletedClient) {
    const { error } = await supabase.from("clients").update({ deleted_at: null }).eq("id", c.id);
    if (error) { toast.error("Erro ao restaurar cliente"); return; }
    const desc = logRestaurarCliente({ responsavel: nomePersonagem || user?.email || "Sistema", nomeCliente: c.nome });
    await registrarLog({ ...logBase(), action: "restaurar", entity: "cliente", entityId: c.id, description: desc, afterData: { restaurado: true } });
    toast.success("Cliente restaurado");
    fetchAll();
  }

  async function rollbackUpdate(log: UpdateLog) {
    if (!log.entity_id || !log.before_data) {
      toast.error("Log sem dados suficientes para reverter");
      return;
    }
    // Mapear para o nome de tabela e payload correto
    const entityToTable: Record<string, string> = {
      "cliente": "clients",
      "operação": "operations",
      "usuário": "profiles",
    };
    const table = entityToTable[log.entity];
    if (!table) { toast.error(`Entidade '${log.entity}' não suportada para reversão`); return; }

    // Constrói payload removendo metadados
    const before = { ...(log.before_data as any) };
    delete before.descricao;
    delete before.id;
    delete before.created_at;
    delete before.updated_at;
    delete before.deleted_at;
    delete before.user_id;

    // Para cliente, AppContext salva os campos camelCase; convertemos para snake_case
    if (table === "clients") {
      const payload: any = {};
      if ("nome" in before) payload.nome = before.nome;
      if ("tipo" in before) payload.tipo = before.tipo;
      if ("taxa" in before) payload.taxa = Number(before.taxa);
      if ("cor" in before) payload.cor = before.cor;
      if ("createdAt" in before) {/* skip */}
      const { error } = await supabase.from("clients").update(payload).eq("id", log.entity_id);
      if (error) { toast.error("Erro ao reverter: " + error.message); return; }
    } else if (table === "operations") {
      const payload: any = {};
      if ("status" in before) payload.status = before.status;
      const { error } = await supabase.from("operations").update(payload).eq("id", log.entity_id);
      if (error) { toast.error("Erro ao reverter: " + error.message); return; }
    } else if (table === "profiles") {
      const payload: any = {};
      if ("status" in before) payload.status = before.status;
      if ("role" in before) payload.role = before.role;
      const { error } = await supabase.from("profiles").update(payload).eq("user_id", log.entity_id);
      if (error) { toast.error("Erro ao reverter: " + error.message); return; }
    }

    const desc = logReverterEdicao({
      responsavel: nomePersonagem || user?.email || "Sistema",
      entidade: log.entity,
      identificacao: log.entity_id.slice(0, 8),
    });
    await registrarLog({ ...logBase(), action: "reverter", entity: log.entity, entityId: log.entity_id, description: desc, beforeData: log.after_data, afterData: log.before_data });
    toast.success("Edição revertida");
    fetchAll();
  }

  if (roleLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  if (!isDev) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a Desenvolvedores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Restaurações</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Restaure registros excluídos ou reverta edições para o estado anterior. Toda restauração gera um novo log.
      </p>

      <Tabs defaultValue="ops" className="w-full">
        <TabsList>
          <TabsTrigger value="ops">Operações Excluídas ({deletedOps.length})</TabsTrigger>
          <TabsTrigger value="clients">Clientes Excluídos ({deletedClients.length})</TabsTrigger>
          <TabsTrigger value="rollback">Reverter Edições ({updateLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ops" className="mt-4">
          <div className="glass-card rounded-lg overflow-hidden">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Excluído em</TableHead>
                    <TableHead className="w-32">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : deletedOps.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma operação excluída</TableCell></TableRow>
                  ) : deletedOps.map(op => (
                    <TableRow key={op.id}>
                      <TableCell className="font-medium">{clientNames[op.client_id] || "—"}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(Number(op.valor_bruto))}</TableCell>
                      <TableCell><Badge variant="outline">{op.status}</Badge></TableCell>
                      <TableCell className="text-sm">{op.responsavel}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(op.deleted_at)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => restoreOperation(op)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <div className="glass-card rounded-lg overflow-hidden">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Excluído em</TableHead>
                    <TableHead className="w-32">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : deletedClients.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente excluído</TableCell></TableRow>
                  ) : deletedClients.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                      <TableCell className="font-mono">{Number(c.taxa)}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(c.deleted_at)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => restoreClient(c)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="rollback" className="mt-4">
          <div className="glass-card rounded-lg overflow-hidden">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Quem editou</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead className="min-w-[300px]">Descrição</TableHead>
                    <TableHead className="w-36">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : updateLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma edição registrada</TableCell></TableRow>
                  ) : updateLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{log.nome_personagem || log.user_email || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{log.entity}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.after_data?.descricao || "—"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => rollbackUpdate(log)} disabled={!log.before_data || !log.entity_id}>
                          <Undo2 className="h-3 w-3 mr-1" /> Reverter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
