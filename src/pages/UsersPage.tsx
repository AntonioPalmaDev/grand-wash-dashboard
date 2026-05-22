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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Shield, CheckCircle2, XCircle, Clock, Building2, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDateOnly } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: "visualizador" | "gestao" | "desenvolvedor" | "admin_master";
  status: "pendente" | "aprovado" | "rejeitado";
  motivo_rejeicao: string | null;
  created_at: string;
  company_id?: string;
  user_companies?: any[];
}

import { useCompany } from "@/context/CompanyContext";

export default function UsersPage() {
  const { user, isMasterAdmin } = useAuth();
  const { activeCompany } = useCompany();
  const { isDev } = useRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [rejectUserId, setRejectUserId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRoleValue] = useState<Profile["role"]>("gestao");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [availableCompaniesList, setAvailableCompaniesList] = useState<any[]>([]);
  const [myName, setMyName] = useState("");

  useEffect(() => {
    fetchProfiles();
    fetchAvailableCompanies();
    if (user) {
      supabase.from("profiles").select("nome").eq("user_id", user.id).single()
        .then(({ data }) => { if (data?.nome) setMyName(data.nome); });
    }
  }, [user, activeCompany]);

  async function fetchAvailableCompanies() {
    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("active", true);
    if (!error && data) {
      setAvailableCompaniesList(data);
      if (activeCompany) setTargetCompanies([activeCompany.id]);
    }
  }

  const getMyName = () => myName || user?.email || "Sistema";

  async function fetchProfiles() {
    if (!activeCompany) return;
    setLoading(true);
    
    try {
      const { data: userCompanies, error: ucError } = await supabase
        .from("user_companies")
        .select("user_id")
        .eq("company_id", activeCompany.id);

      if (ucError) throw ucError;

      if (!userCompanies || userCompanies.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const userIds = userCompanies.map(uc => uc.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_companies(company_id)")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setProfiles(data as Profile[]);
    } catch (err: any) {
      console.error("Erro ao buscar perfis:", err);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!user) return;
    if (!email || !password) { toast.error("Email e senha são obrigatórios"); return; }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nome, nome_personagem: nome, companies: targetCompanies } } });
    if (error) { toast.error(error.message); return; }
    if (data.user) {
      const selectedCompanyId = targetCompanies.length > 0 ? targetCompanies[0] : activeCompany?.id;
      
      await supabase.from("profiles").update({ 
        role: role as any, 
        nome, 
        company_id: selectedCompanyId 
      }).eq("user_id", data.user.id);

      if (role === "desenvolvedor" || role === "admin_master") {
        await supabase.from("user_roles").upsert({ 
          user_id: data.user.id, 
          role: role as any, 
          company_id: selectedCompanyId 
        });
      }

      if (targetCompanies.length > 0) {
        const links = targetCompanies.map(cid => ({
          user_id: data.user!.id,
          company_id: cid
        }));
        await supabase.from("user_companies").insert(links);
      } else if (activeCompany) {
        await supabase.from("user_companies").insert({ 
          user_id: data.user.id, 
          company_id: activeCompany.id 
        });
      }
      const desc = logCriarUsuario({ responsavel: getMyName(), nomeUsuario: nome || email, email });
      await registrarLog({ 
        userId: user.id, 
        userEmail: user.email || "", 
        companyId: activeCompany?.id, 
        action: "criar", 
        entity: "usuário", 
        entityId: data.user.id, 
        description: desc, 
        afterData: { nome, email, role, company_ids: targetCompanies } 
      });
    }
    toast.success("Usuário criado com sucesso");
    setOpen(false); setNome(""); setEmail(""); setPassword(""); setRoleValue("gestao"); setTargetCompanies(activeCompany ? [activeCompany.id] : []);
    fetchProfiles();
  }

  async function handleApprove(userId: string) {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === userId);
    const { error } = await supabase.from("profiles").update({ status: "aprovado" }).eq("user_id", userId);
    if (error) { toast.error("Erro ao aprovar usuário"); return; }
    const desc = logAlterarStatusUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", statusAnterior: profile?.status || "---", statusNovo: "aprovado" });
    await registrarLog({ userId: user.id, userEmail: user.email || "", companyId: activeCompany?.id, action: "status", entity: "usuário", entityId: userId, description: desc, beforeData: { status: profile?.status }, afterData: { status: "aprovado" } });
    toast.success("Usuário aprovado!");
    fetchProfiles();
  }

  async function handleReject() {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === rejectUserId);
    const { error } = await supabase.from("profiles").update({ status: "rejeitado", motivo_rejeicao: motivo || null }).eq("user_id", rejectUserId);
    if (error) { toast.error("Erro ao rejeitar usuário"); return; }
    const desc = logAlterarStatusUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", statusAnterior: profile?.status || "---", statusNovo: "rejeitado" });
    await registrarLog({ userId: user.id, userEmail: user.email || "", companyId: activeCompany?.id, action: "status", entity: "usuário", entityId: rejectUserId, description: desc, beforeData: { status: profile?.status }, afterData: { status: "rejeitado", motivo } });
    toast.success("Usuário rejeitado");
    setRejectOpen(false); setMotivo(""); setRejectUserId("");
    fetchProfiles();
  }

  function openRejectDialog(userId: string) {
    setRejectUserId(userId); setMotivo(""); setRejectOpen(true);
  }

  async function handleChangeRole(userId: string, newRole: Profile["role"]) {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === userId);
    await supabase.from("profiles").update({ role: newRole as any }).eq("user_id", userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    if (newRole === "desenvolvedor" || newRole === "admin_master") {
      await supabase.from("user_roles").insert({ 
        user_id: userId, 
        role: newRole as any, 
        company_id: profile?.company_id || activeCompany?.id 
      });
    }
    const desc = logAlterarRoleUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", roleAnterior: profile?.role || "---", roleNova: newRole });
    await registrarLog({ userId: user.id, userEmail: user.email || "", companyId: activeCompany?.id, action: "editar", entity: "usuário", entityId: userId, description: desc, beforeData: { role: profile?.role }, afterData: { role: newRole } });
    toast.success("Role atualizada");
    fetchProfiles();
  }

  async function handleCompanyLinksChange() {
    if (!user || !selectedUser) return;
    
    setLoading(true);
    try {
      await supabase.from("user_companies").delete().eq("user_id", selectedUser.user_id);
      
      if (selectedCompanies.length > 0) {
        const links = selectedCompanies.map(id => ({
          user_id: selectedUser.user_id,
          company_id: id
        }));
        await supabase.from("user_companies").insert(links);
        
        await supabase.from("profiles").update({ company_id: selectedCompanies[0] }).eq("user_id", selectedUser.user_id);
        
        if (selectedUser.role === "desenvolvedor" || selectedUser.role === "admin_master") {
          await supabase.from("user_roles").update({ company_id: selectedCompanies[0] }).eq("user_id", selectedUser.user_id);
        }
      } else {
        await supabase.from("profiles").update({ company_id: null }).eq("user_id", selectedUser.user_id);
      }

      await registrarLog({ 
        userId: user.id, 
        userEmail: user.email || "", 
        companyId: activeCompany?.id, 
        action: "editar", 
        entity: "usuário", 
        entityId: selectedUser.user_id, 
        description: `Alterou vínculos de empresas do usuário ${selectedUser.nome || selectedUser.email}`, 
        afterData: { company_ids: selectedCompanies } 
      });
      
      toast.success("Vínculos de empresa atualizados");
      setCompanyDialogOpen(false);
      fetchProfiles();
    } catch (err: any) {
      toast.error("Erro ao atualizar empresas");
    } finally {
      setLoading(false);
    }
  }

  const toggleTargetCompany = (id: string) => {
    setTargetCompanies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectedCompany = (id: string) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  async function handleStatusChange(userId: string, newStatus: "pendente" | "aprovado" | "rejeitado") {
    if (!user) return;
    const profile = profiles.find(p => p.user_id === userId);
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("user_id", userId);
    if (error) { toast.error("Erro ao alterar status"); return; }
    const desc = logAlterarStatusUsuario({ responsavel: getMyName(), nomeUsuario: profile?.nome || profile?.email || "---", statusAnterior: profile?.status || "---", statusNovo: newStatus });
    await registrarLog({ userId: user.id, userEmail: user.email || "", companyId: activeCompany?.id, action: "status", entity: "usuário", entityId: userId, description: desc, beforeData: { status: profile?.status }, afterData: { status: newStatus } });
    toast.success(`Status alterado para ${newStatus}`);
    fetchProfiles();
  }

  const pendingProfiles = profiles.filter(p => p.status === "pendente");
  const approvedProfiles = profiles.filter(p => p.status === "aprovado");
  const rejectedProfiles = profiles.filter(p => p.status === "rejeitado");

  if (!isDev && !isMasterAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a Administradores</p>
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
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Criar Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do usuário" /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
              <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
              <div>
                <Label>Empresas vinculadas *</Label>
                <div className="border border-border/50 rounded-lg bg-background/50 overflow-hidden mt-1">
                  <ScrollArea className="h-[120px]">
                    <div className="p-2 space-y-1">
                      {availableCompaniesList.map((c) => (
                        <div 
                          key={c.id} 
                          className={`flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent/50 ${targetCompanies.includes(c.id) ? 'bg-primary/10 border-primary/20 border' : 'border border-transparent'}`}
                          onClick={() => toggleTargetCompany(c.id)}
                        >
                          <Checkbox checked={targetCompanies.includes(c.id)} onCheckedChange={() => toggleTargetCompany(c.id)} />
                          <span className="text-xs font-medium flex-1">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRoleValue(v as Profile["role"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                    <SelectItem value="gestao">Gestão</SelectItem>
                    <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                    <SelectItem value="admin_master">Admin Master</SelectItem>
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
                      <TableCell className="text-muted-foreground text-sm">{formatDateOnly(p.created_at)}</TableCell>
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
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Empresas</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Alterar Role</TableHead><TableHead>Vincular Empresas</TableHead><TableHead>Alterar Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {approvedProfiles.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div>{p.nome || "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{p.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {p.user_companies?.map((uc: any) => (
                          <Badge key={uc.company_id} variant="secondary" className="text-[9px] py-0 h-4">
                            {uc.companies?.name || availableCompaniesList.find(c => c.id === uc.company_id)?.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        p.role === "admin_master" ? "destructive" : 
                        p.role === "desenvolvedor" ? "default" : 
                        p.role === "visualizador" ? "outline" : "secondary"
                      }>
                        <Shield className="h-3 w-3 mr-1" />
                        {p.role === "admin_master" ? "Admin Master" : 
                         p.role === "desenvolvedor" ? "Desenvolvedor" : 
                         p.role === "gestao" ? "Gestão" : "Visualizador"}
                      </Badge>
                    </TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>
                      <Select value={p.role} onValueChange={(v) => handleChangeRole(p.user_id, v as any)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visualizador">Visualizador</SelectItem>
                          <SelectItem value="gestao">Gestão</SelectItem>
                          <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                          <SelectItem value="admin_master">Admin Master</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => {
                          setSelectedUser(p);
                          setSelectedCompanies(p.user_companies?.map((uc: any) => uc.company_id) || []);
                          setCompanyDialogOpen(true);
                        }}
                      >
                        <Building2 className="h-4 w-4" /> Gerenciar
                      </Button>
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

      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Gerenciar Empresas
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">
              Selecione as empresas que {selectedUser?.nome || selectedUser?.email} pode acessar:
            </Label>
            <div className="border border-border/50 rounded-lg bg-background/50 overflow-hidden mt-1">
              <ScrollArea className="h-[200px]">
                <div className="p-2 space-y-1">
                  {availableCompaniesList.map((c) => (
                    <div 
                      key={c.id} 
                      className={`flex items-center space-x-3 p-3 rounded-md transition-colors cursor-pointer hover:bg-accent/50 ${selectedCompanies.includes(c.id) ? 'bg-primary/10 border-primary/20 border' : 'border border-transparent'}`}
                      onClick={() => toggleSelectedCompany(c.id)}
                    >
                      <Checkbox checked={selectedCompanies.includes(c.id)} onCheckedChange={() => toggleSelectedCompany(c.id)} />
                      <span className="text-sm font-medium flex-1">{c.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCompanyLinksChange} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
