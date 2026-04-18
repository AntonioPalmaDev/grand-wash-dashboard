import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

interface AuditLog {
  id: string;
  user_email: string | null;
  nome_personagem: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

const actionColors: Record<string, string> = {
  criar: "bg-green-500/20 text-green-400",
  editar: "bg-yellow-500/20 text-yellow-400",
  excluir: "bg-red-500/20 text-red-400",
  status: "bg-blue-500/20 text-blue-400",
  config: "bg-purple-500/20 text-purple-400",
  restaurar: "bg-emerald-500/20 text-emerald-400",
  reverter: "bg-orange-500/20 text-orange-400",
};

export default function AuditLogsPage() {
  const { isDev } = useRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setLogs(data as AuditLog[]);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("audit_logs").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir log"); return; }
    setLogs(prev => prev.filter(l => l.id !== id));
    toast.success("Log excluído");
  }

  function getDescription(log: AuditLog): string {
    return log.after_data?.descricao || log.before_data?.descricao || "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="min-w-[300px]">Descrição</TableHead>
                {isDev && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum log registrado</TableCell></TableRow>
              ) : logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{log.nome_personagem || "—"}</div>
                    <div className="text-xs text-muted-foreground">{log.user_email || ""}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={actionColors[log.action] || "bg-muted text-muted-foreground"}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.entity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getDescription(log)}
                  </TableCell>
                  {isDev && (
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(log.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
