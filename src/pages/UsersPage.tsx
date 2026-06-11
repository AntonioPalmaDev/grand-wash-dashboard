import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import {
  registrarLog,
  logAlterarStatusUsuario,
  logAlterarRoleUsuario,
  logCriarUsuario,
} from "@/lib/logging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateOnly } from "@/lib/format";


interface Profile {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  role: "visualizador" | "gestao" | "desenvolvedor" | "admin_master";
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
  const [role, setRoleValue] = useState<Profile["role"]>("gestao");

  const [myName, setMyName] = useState("");

  useEffect(() => {
    fetchProfiles();

    if (user) {
      supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.nome) setMyName(data.nome);
        });
    }
  }, [user]);

  const getMyName = () => myName || user?.email || "Sistema";

  async function fetchProfiles() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProfiles((data || []) as Profile[]);
    } catch (err) {
      console.error("Erro ao buscar perfis:", err);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!user) return;

    if (!nome || !email || !password) {
      toast.error("Nome, email e senha são obrigatórios");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          nome_personagem: nome,
          
        },
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          role: role as any,
          nome,
          status: "aprovado",
        })
        .eq("user_id", data.user.id);

      if (role === "desenvolvedor" || role === "admin_master") {
        await supabase.from("user_roles").upsert({
          user_id: data.user.id,
          role: role as any,
          
        } as any);
      }

      const desc = logCriarUsuario({
        responsavel: getMyName(),
        nomeUsuario: nome || email,
        email,
      });

      await registrarLog({
        userId: user.id,
        userEmail: user.email || "",
        action: "criar",
        entity: "usuário",
        entityId: data.user.id,
        description: desc,
        afterData: { nome, email, role },
      });
    }

    toast.success("Usuário criado com sucesso");
    setOpen(false);
    setNome("");
    setEmail("");
    setPassword("");
    setRoleValue("gestao");
    fetchProfiles();
  }

  async function handleApprove(userId: string) {
    if (!user) return;

    const profile = profiles.find((p) => p.user_id === userId);

    const { error } = await supabase
      .from("profiles")
      .update({ status: "aprovado" })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao aprovar usuário");
      return;
    }

    const desc = logAlterarStatusUsuario({
      responsavel: getMyName(),
      nomeUsuario: profile?.nome || profile?.email || "---",
      statusAnterior: profile?.status || "---",
      statusNovo: "aprovado",
    });

    await registrarLog({
      userId: user.id,
      userEmail: user.email || "",
      action: "status",
      entity: "usuário",
      entityId: userId,
      description: desc,
      beforeData: { status: profile?.status },
      afterData: { status: "aprovado" },
    });

    toast.success("Usuário aprovado!");
    fetchProfiles();
  }

  function openRejectDialog(userId: string) {
    setRejectUserId(userId);
    setMotivo("");
    setRejectOpen(true);
  }

  async function handleReject() {
    if (!user) return;

    const profile = profiles.find((p) => p.user_id === rejectUserId);

    const { error } = await supabase
      .from("profiles")
      .update({
        status: "rejeitado",
        motivo_rejeicao: motivo || null,
      })
      .eq("user_id", rejectUserId);

    if (error) {
      toast.error("Erro ao rejeitar usuário");
      return;
    }

    const desc = logAlterarStatusUsuario({
      responsavel: getMyName(),
      nomeUsuario: profile?.nome || profile?.email || "---",
      statusAnterior: profile?.status || "---",
      statusNovo: "rejeitado",
    });

    await registrarLog({
      userId: user.id,
      userEmail: user.email || "",
      action: "status",
      entity: "usuário",
      entityId: rejectUserId,
      description: desc,
      beforeData: { status: profile?.status },
      afterData: { status: "rejeitado", motivo },
    });

    toast.success("Usuário rejeitado");
    setRejectOpen(false);
    setMotivo("");
    setRejectUserId("");
    fetchProfiles();
  }

  async function handleChangeRole(userId: string, newRole: Profile["role"]) {
    if (!user) return;

    const profile = profiles.find((p) => p.user_id === userId);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole as any })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao atualizar função");
      return;
    }

    await supabase.from("user_roles").delete().eq("user_id", userId);

    if (newRole === "desenvolvedor" || newRole === "admin_master") {
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: newRole as any,
       
      } as any);
    }

    const desc = logAlterarRoleUsuario({
      responsavel: getMyName(),
      nomeUsuario: profile?.nome || profile?.email || "---",
      roleAnterior: profile?.role || "---",
      roleNova: newRole,
    });

    await registrarLog({
      userId: user.id,
      userEmail: user.email || "",
      action: "editar",
      entity: "usuário",
      entityId: userId,
      description: desc,
      beforeData: { role: profile?.role },
      afterData: { role: newRole },
    });

    toast.success("Função atualizada");
    fetchProfiles();
  }

  function getStatusBadge(status: Profile["status"]) {
    if (status === "aprovado") {
      return <Badge className="bg-emerald-500/20 text-emerald-400">Aprovado</Badge>;
    }

    if (status === "rejeitado") {
      return <Badge className="bg-red-500/20 text-red-400">Rejeitado</Badge>;
    }

    return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
  }

  function getRoleLabel(value: Profile["role"]) {
    const labels = {
      visualizador: "Visualizador",
      gestao: "Gestão",
      desenvolvedor: "Desenvolvedor",
      admin_master: "Admin Master",
    };

    return labels[value] || value;
  }

  if (!isDev) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para gerenciar usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Usuários do Sistema
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários vinculados à Zero Foco.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo usuário</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    setRoleValue(value as Profile["role"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                    <SelectItem value="gestao">Gestão</SelectItem>
                    <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                    <SelectItem value="admin_master">Admin Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar Usuário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando usuários...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.nome || "---"}
                    </TableCell>

                    <TableCell>{profile.email || "---"}</TableCell>

                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(value) =>
                          handleChangeRole(
                            profile.user_id,
                            value as Profile["role"]
                          )
                        }
                      >
                        <SelectTrigger className="w-[170px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visualizador">
                            Visualizador
                          </SelectItem>
                          <SelectItem value="gestao">Gestão</SelectItem>
                          <SelectItem value="desenvolvedor">
                            Desenvolvedor
                          </SelectItem>
                          <SelectItem value="admin_master">
                            Admin Master
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>{getStatusBadge(profile.status)}</TableCell>

                    <TableCell>
                      {profile.created_at
                        ? formatDateOnly(profile.created_at)
                        : "---"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {profile.status !== "aprovado" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(profile.user_id)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar
                          </Button>
                        )}

                        {profile.status !== "rejeitado" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectDialog(profile.user_id)}
                            className="gap-1 text-red-400"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        )}

                        {profile.status === "pendente" && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Aguardando
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Motivo da rejeição</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Informe o motivo da rejeição..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}