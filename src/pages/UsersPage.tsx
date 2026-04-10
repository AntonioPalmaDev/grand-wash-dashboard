import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: "desenvolvedor" | "gestao";
  created_at: string;
}

export default function UsersPage() {
  const { isDev } = useRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRoleValue] = useState<"desenvolvedor" | "gestao">("gestao");

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  }

  async function handleCreate() {
    if (!email || !password) {
      toast.error("Email e senha são obrigatórios");
      return;
    }

    // Create user via edge function or direct signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user) {
      // Update role if not default
      if (role === "desenvolvedor") {
        await supabase.from("profiles").update({ role, nome }).eq("user_id", data.user.id);
        await supabase.from("user_roles").upsert({ user_id: data.user.id, role });
      } else if (nome) {
        await supabase.from("profiles").update({ nome }).eq("user_id", data.user.id);
      }
    }

    toast.success("Usuário criado com sucesso");
    setOpen(false);
    setNome("");
    setEmail("");
    setPassword("");
    setRoleValue("gestao");
    fetchProfiles();
  }

  async function handleChangeRole(userId: string, newRole: "desenvolvedor" | "gestao") {
    await supabase.from("profiles").update({ role: newRole }).eq("user_id", userId);
    
    // Update user_roles table
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    
    toast.success("Role atualizada");
    fetchProfiles();
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
            <DialogHeader>
              <DialogTitle>Criar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do usuário" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRoleValue(v as "desenvolvedor" | "gestao")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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

      <div className="glass-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome || "—"}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>
                  <Badge variant={p.role === "desenvolvedor" ? "default" : "secondary"}>
                    <Shield className="h-3 w-3 mr-1" />
                    {p.role === "desenvolvedor" ? "Desenvolvedor" : "Gestão"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Select
                    value={p.role}
                    onValueChange={(v) => handleChangeRole(p.user_id, v as "desenvolvedor" | "gestao")}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestao">Gestão</SelectItem>
                      <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
