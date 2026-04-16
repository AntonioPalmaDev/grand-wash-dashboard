import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { registrarLog, logAlterarStatusUsuario, logAlterarRoleUsuario, logCriarUsuario } from "@/lib/logging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Shield, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: "desenvolvedor" | "gestao";
  status: "pendente" | "aprovado" | "rejeitado";
  motivo_rejeicao: string | null;
  created_at: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const { isDev } = useRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectUserId, setRejectUserId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRoleValue] = useState<"desenvolvedor" | "gestao">("gestao");
  const [myName, setMyName] = useState("");

  useEffect(() => {
    fetchProfiles();
    if (user) {
      supabase.from("profiles").select("nome").eq("user_id", user.id).single()
        .then(({ data }) => { if (data?.nome) setMyName(data.nome); });
    }
  }, [user]);

  const getMyName = () => myName || user?.email || "Sistema";

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  }

  async function handleCreate() {
    if (!user) return;
    if (!email || !password) { toast.error("Email e senha são obrigatórios"); return; }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nome } } });
    if (error) { toast.error(error.message); return; }
    if (data.user) {
      if (role === "desenvolvedor") {
        await supabase.from("profiles").update({ role, nome }).eq("user_id", data.user.id);
        await supabase.from("user_roles").upsert({ user_id: data.user.id, role });
      } else if (nome) {
        await supabase.from("profiles").update({ nome }).eq("user_id", data.user.id);
      }
      const desc = logCriarUsuario({ responsavel: getMyName(), nomeUsuario: nome || email, email });
      await registrarLog({ userId: user.id, userEmail: user.email || "", action: "criar", entity: "usuário", entityId: data.user.id, description: desc, afterData: { nome, email, role } });
    }
    toast.success("Usuário criado com sucesso");
    setOpen(false); setNome(""); setEmail(""); setPassword(""); setRoleValue("gestao");
    fetchProfiles();
  }

  async function handleApprove(userId: string) {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === userId);
    const { error } = await supabase.from("profiles").update({ status: "aprovado" }).eq("user_id", userId);
    if (error) { toast.error("Erro ao aprovar usuário"); return; }
    const desc = logAlterarStatusUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", statusAnterior: profile?.status || "---", statusNovo: "aprovado" });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "status", entity: "usuário", entityId: userId, description: desc, beforeData: { status: profile?.status }, afterData: { status: "aprovado" } });
    toast.success("Usuário aprovado!");
    fetchProfiles();
  }

  async function handleReject() {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === rejectUserId);
    const { error } = await supabase.from("profiles").update({ status: "rejeitado", motivo_rejeicao: motivo || null }).eq("user_id", rejectUserId);
    if (error) { toast.error("Erro ao rejeitar usuário"); return; }
    const desc = logAlterarStatusUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", statusAnterior: profile?.status || "---", statusNovo: "rejeitado" });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "status", entity: "usuário", entityId: rejectUserId, description: desc, beforeData: { status: profile?.status }, afterData: { status: "rejeitado", motivo } });
    toast.success("Usuário rejeitado");
    setRejectOpen(false); setMotivo(""); setRejectUserId("");
    fetchProfiles();
  }

  function openRejectDialog(userId: string) {
    setRejectUserId(userId); setMotivo(""); setRejectOpen(true);
  }

  async function handleChangeRole(userId: string, newRole: "desenvolvedor" | "gestao") {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === userId);
    await supabase.from("profiles").update({ role: newRole }).eq("user_id", userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    const desc = logAlterarRoleUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", roleAnterior: profile?.role || "---", roleNova: newRole });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "editar", entity: "usuário", entityId: userId, description: desc, beforeData: { role: profile?.role }, afterData: { role: newRole } });
    toast.success("Role atualizada");
    fetchProfiles();
  }

  async function handleStatusChange(userId: string, newStatus: "pendente" | "aprovado" | "rejeitado") {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === userId);
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("user_id", userId);
    if (error) { toast.error("Erro ao alterar status"); return; }
    const desc = logAlterarStatusUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", statusAnterior: profile?.status || "---", statusNovo: newStatus });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "status", entity: "usuário", entityId: userId, description: desc, beforeData: { status: profile?.status }, afterData: { status: newStatus } });
    toast.success(`Status alterado para ${newStatus}`);
    fetchProfiles();
  }

  const pendingProfiles = profiles.filter(p => p.status === "pendente");
  const approvedProfiles = profiles.filter(p => p.status === "aprovado");
  const rejectedProfiles = profiles.filter(p => p.status === "rejeitado");

  if (!isDev) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a Desenvolvedores</p>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "aprovado") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
    if (status === "rejeitado") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
    return <Badge variant="outline" className="border-yellow-500/50 text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do usuário" /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
              <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRoleValue(v as "desenvolvedor" | "gestao")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gestao">Gestão</SelectItem>
                    <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Usuário</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div><Label>Motivo da rejeição (opcional)</Label><Textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Informe o motivo..." rows={3} /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)} className="flex-1">Cancelar</Button>
              <Button variant="destructive" onClick={handleReject} className="flex-1">Confirmar Rejeição</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {pendingProfiles.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{pendingProfiles.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovados ({approvedProfiles.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados ({rejectedProfiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingProfiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Clock className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma solicitação pendente</p></div>
          ) : (
            <div className="glass-card rounded-lg overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pendingProfiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome || "—"}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={(v) => handleStatusChange(p.user_id, v as any)}>
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(p.user_id)} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-4 w-4 mr-1" />Aceitar</Button>
                          <Button size="sm" variant="destructive" onClick={() => openRejectDialog(p.user_id)}><XCircle className="h-4 w-4 mr-1" />Rejeitar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <div className="glass-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Alterar Role</TableHead><TableHead>Alterar Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {approvedProfiles.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome || "—"}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell><Badge variant={p.role === "desenvolvedor" ? "default" : "secondary"}><Shield className="h-3 w-3 mr-1" />{p.role === "desenvolvedor" ? "Desenvolvedor" : "Gestão"}</Badge></TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>
                      <Select value={p.role} onValueChange={(v) => handleChangeRole(p.user_id, v as any)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="gestao">Gestão</SelectItem><SelectItem value="desenvolvedor">Desenvolvedor</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={p.status} onValueChange={(v) => handleStatusChange(p.user_id, v as any)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedProfiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><p>Nenhum usuário rejeitado</p></div>
          ) : (
            <div className="glass-card rounded-lg overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Motivo</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rejectedProfiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome || "—"}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{p.motivo_rejeicao || "—"}</TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={(v) => handleStatusChange(p.user_id, v as any)}>
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(p.user_id)}><CheckCircle2 className="h-4 w-4 mr-1" />Reaprovar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
