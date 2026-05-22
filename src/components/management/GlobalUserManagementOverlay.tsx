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
  AlertTriangle,
  Check
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  
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
      // Buscar profiles e seus vínculos na user_companies
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          user_companies(
            company_id,
            companies(id, name, slug)
          )
        `);

      if (profileError) {
        console.error("Erro ao buscar perfis:", profileError);
        throw profileError;
      }
      
      console.log("Perfis carregados:", profiles);
      setUsers(profiles || []);
    } catch (error: any) {
      console.error("Erro no fetchGlobalUsers:", error);
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
      
      // Atualizar roles em user_roles se necessário (legado/dependências)
      await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);
      if (newRole === "desenvolvedor" || newRole === "admin_master") {
        // Usa a primeira empresa vinculada como referência se existir
        const mainCompanyId = selectedUser.user_companies?.[0]?.company_id || selectedUser.company_id;
        if (mainCompanyId) {
          await supabase.from("user_roles").insert({
            user_id: selectedUser.user_id,
            role: newRole as any,
            company_id: mainCompanyId
          });
        }
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

  const handleCompanyLinksChange = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      // 1. Remover todos os vínculos atuais em user_companies
      const { error: deleteError } = await supabase
        .from("user_companies")
        .delete()
        .eq("user_id", selectedUser.user_id);
      
      if (deleteError) throw deleteError;

      // 2. Inserir novos vínculos
      if (selectedCompanies.length > 0) {
        const newLinks = selectedCompanies.map(id => ({
          user_id: selectedUser.user_id,
          company_id: id
        }));
        
        const { error: insertError } = await supabase
          .from("user_companies")
          .insert(newLinks);
          
        if (insertError) throw insertError;

        // 3. Atualizar company_id principal no profile (para compatibilidade)
        await supabase
          .from("profiles")
          .update({ company_id: selectedCompanies[0] })
          .eq("user_id", selectedUser.user_id);
      } else {
        // Se desvincular de todas, limpa o profile
        await supabase
          .from("profiles")
          .update({ company_id: null })
          .eq("user_id", selectedUser.user_id);
      }

      toast({ title: "Vínculos de empresa atualizados" });
      setCompanyDialogOpen(false);
      fetchGlobalUsers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar empresas", description: error.message });
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
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      await (supabase.from("audit_logs").insert as any)([{
        user_id: currentUser?.id || "",
        user_email: currentUser?.email || "",
        action: "excluir",
        entity: "usuário",
        entity_id: selectedUser.user_id,
        description: `Exclusão global do usuário ${selectedUser.nome} (${selectedUser.email}). Justificativa: ${deleteJustification}`,
        before_data: selectedUser as any
      }]);

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
    u.user_companies?.some((uc: any) => uc.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId) 
        : [...prev, companyId]
    );
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
            {loading && users.length === 0 ? (
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
                          {user.user_companies && user.user_companies.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {user.user_companies.map((uc: any) => (
                                <Badge key={uc.company_id} variant="outline" className="text-[9px] bg-primary/5 border-primary/20 text-primary py-0 h-4 font-bold uppercase">
                                  {uc.companies?.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                          ID: {user.user_id?.substring(0, 8) || user.id.substring(0, 8)}
                        </span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/10 rounded-xl w-9 h-9">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-200 rounded-xl p-1.5 min-w-[160px]">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-500 px-2 py-1.5">Ações</DropdownMenuLabel>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary text-xs py-2.5"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Shield className="w-3.5 h-3.5" /> Mudar Permissão
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary text-xs py-2.5"
                            onClick={() => {
                              setSelectedUser(user);
                              const currentIds = user.user_companies?.map((uc: any) => uc.company_id) || [];
                              setSelectedCompanies(currentIds);
                              setCompanyDialogOpen(true);
                            }}
                          >
                            <Building2 className="w-3.5 h-3.5" /> Vincular Empresas
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400 text-xs py-2.5"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteJustification("");
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir Usuário
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

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Alterar Permissão
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Defina o novo nível de acesso para {selectedUser?.nome || selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="visualizador">Visualizador</SelectItem>
                <SelectItem value="gestao">Gestão</SelectItem>
                <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                <SelectItem value="admin_master">Admin Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} className="bg-transparent border-white/10 text-white hover:bg-white/5">
              Cancelar
            </Button>
            <Button onClick={handleRoleChange} disabled={loading} className="font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Gerenciar Empresas
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecione as empresas que {selectedUser?.nome || selectedUser?.email} pode acessar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {availableCompanies.map(company => (
                  <div 
                    key={company.id} 
                    className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => toggleCompanySelection(company.id)}
                  >
                    <Checkbox 
                      id={`company-${company.id}`} 
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={() => toggleCompanySelection(company.id)}
                      className="border-white/20 data-[state=checked]:bg-primary"
                    />
                    <label 
                      htmlFor={`company-${company.id}`}
                      className="text-sm font-medium text-slate-200 cursor-pointer flex-1"
                    >
                      {company.name}
                    </label>
                    {selectedCompanies.includes(company.id) && <Check className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCompanyDialogOpen(false)} className="bg-transparent border-white/10 text-white hover:bg-white/5">
              Cancelar
            </Button>
            <Button onClick={handleCompanyLinksChange} disabled={loading} className="font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta ação é irreversível. O usuário <strong>{selectedUser?.nome}</strong> perderá acesso a todo o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Justificativa da Exclusão</label>
              <Textarea 
                placeholder="Informe o motivo pelo qual este usuário está sendo removido..."
                value={deleteJustification}
                onChange={(e) => setDeleteJustification(e.target.value)}
                className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-red-500/50"
              />
              <p className="text-[10px] text-slate-500 italic">
                * Esta justificativa será registrada nos logs de auditoria do sistema.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="bg-transparent border-white/10 text-white hover:bg-white/5">
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser} 
              disabled={isDeleting || !deleteJustification.trim()}
              className="font-bold bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};
