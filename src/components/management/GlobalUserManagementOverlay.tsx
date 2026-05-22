import React, { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Users, 
  Search, 
  Trash2, 
  Shield, 
  Mail, 
  MoreVertical,
  Loader2,
  Building2,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GlobalUserManagementOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalUserManagementOverlay = ({ isOpen, onClose }: GlobalUserManagementOverlayProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteJustification, setDeleteJustification] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newCompanyId, setNewCompanyId] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchGlobalUsers();
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("id, name").eq("active", true);
    if (data) setAvailableCompanies(data);
  };

  const fetchGlobalUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          company:companies(name, slug)
        `);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários globais",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole as any })
        .eq("user_id", selectedUser.user_id);
      
      if (error) throw error;
      
      await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);
      if (newRole === "desenvolvedor" || newRole === "admin_master") {
        await supabase.from("user_roles").insert({
          user_id: selectedUser.user_id,
          role: newRole as any,
          company_id: selectedUser.company_id
        });
      }

      toast({ title: "Role atualizada com sucesso" });
      setRoleDialogOpen(false);
      fetchGlobalUsers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar role", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async () => {
    if (!selectedUser || !newCompanyId) return;
    setLoading(true);
    try {
      await supabase.from("profiles").update({ company_id: newCompanyId }).eq("user_id", selectedUser.user_id);
      await supabase.from("user_companies").delete().eq("user_id", selectedUser.user_id);
      await supabase.from("user_companies").insert({ user_id: selectedUser.user_id, company_id: newCompanyId });
      
      if (selectedUser.role === "desenvolvedor" || selectedUser.role === "admin_master") {
        await supabase.from("user_roles").update({ company_id: newCompanyId }).eq("user_id", selectedUser.user_id);
      }

      toast({ title: "Empresa atualizada com sucesso" });
      setCompanyDialogOpen(false);
      fetchGlobalUsers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar empresa", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !deleteJustification.trim()) {
      toast({
        variant: "destructive",
        title: "Justificativa obrigatória",
        description: "Por favor, informe o motivo da exclusão."
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Registrar log antes de deletar
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      await supabase.from("logs_audit").insert({
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        action: "excluir",
        entity: "usuário",
        entity_id: selectedUser.user_id,
        description: `Exclusão global do usuário ${selectedUser.nome} (${selectedUser.email}). Justificativa: ${deleteJustification}`,
        before_data: selectedUser
      });

      // Em um cenário real com Supabase Auth, a exclusão de usuário via client side é limitada.
      // Geralmente usamos uma Edge Function para deletar do Auth.
      // Aqui vamos marcar como inativo no profile ou tentar deletar se as políticas permitirem (RPC/Trigger).
      // Por simplicidade e segurança, vamos remover os acessos e limpar o perfil.
      
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", selectedUser.user_id);

      if (profileError) throw profileError;

      toast({
        title: "Usuário removido",
        description: "O usuário foi excluído do sistema com sucesso."
      });
      
      setDeleteDialogOpen(false);
      setDeleteJustification("");
      fetchGlobalUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admim master':
      case 'admin_master':
      case 'master': 
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-bold uppercase text-[9px]">Master</Badge>;
      case 'desenvolvedor': 
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-bold uppercase text-[9px]">Dev</Badge>;
      case 'gestao': 
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold uppercase text-[9px]">Gestão</Badge>;
      case 'visualizador':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 font-bold uppercase text-[9px]">View</Badge>;
      default: 
        return <Badge variant="outline" className="font-bold uppercase text-[9px] text-slate-300">{role}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-slate-950 border-white/10 p-0 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-white/5 space-y-6">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-3xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" /> Usuários Globais
            </SheetTitle>
            <SheetDescription className="text-slate-400 font-medium">
              Gerencie todos os usuários cadastrados em todo o ecossistema.
            </SheetDescription>
          </SheetHeader>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Buscar por nome, email ou empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 text-white pl-10 h-11 rounded-xl focus:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-8">
          <div className="py-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Carregando Ecossistema...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 font-medium">Nenhum usuário encontrado no sistema.</p>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-primary/20 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-white/10 group-hover:border-primary/40 transition-colors shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                        <AvatarFallback className="bg-slate-800 text-white font-bold">
                          {user.nome?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1.5 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white truncate max-w-[150px]">{user.nome || 'Sem Nome'}</span>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate">
                            <Mail className="w-3 h-3 shrink-0" /> {user.email}
                          </div>
                          {user.company && (
                            <div className="flex items-center gap-2 text-[11px] text-primary font-bold uppercase tracking-wider">
                              <Building2 className="w-3 h-3 shrink-0" /> {user.company.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                          ID: {user.id.substring(0, 8)}
                        </span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/10 rounded-xl w-9 h-9">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-200 rounded-xl p-1.5 min-w-[160px]">
                          <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary text-xs py-2.5">
                            <Shield className="w-3.5 h-3.5" /> Mudar Permissão
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary text-xs py-2.5">
                            <Building2 className="w-3.5 h-3.5" /> Trocar Empresa
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400 text-xs py-2.5">
                            <Trash2 className="w-3.5 h-3.5" /> Revogar Acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-8 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
          <Button variant="outline" onClick={onClose} className="w-full border-white/10 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-12 font-bold transition-all">
            Fechar Painel Administrativo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};