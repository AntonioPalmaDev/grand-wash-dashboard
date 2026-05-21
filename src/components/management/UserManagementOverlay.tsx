import React, { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Users, 
  Search, 
  UserPlus, 
  Trash2, 
  Shield, 
  Mail, 
  MoreVertical,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InviteModal } from "./InviteModal";


interface UserManagementOverlayProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementOverlay = ({ company, isOpen, onClose }: UserManagementOverlayProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    if (company && isOpen) {
      fetchUsers();
    }
  }, [company, isOpen]);

  const fetchUsers = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", company.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'desenvolvedor': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Dev</Badge>;
      case 'gestao': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Gestão</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-slate-950 border-white/10 p-0 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-white/5 space-y-6">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-3xl font-black text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" /> Usuários
            </SheetTitle>
            <SheetDescription className="text-slate-400 font-medium">
              Gerencie quem tem acesso ao ambiente {company?.name}.
            </SheetDescription>
          </SheetHeader>

          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar por nome ou email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border-white/10 text-white pl-10 h-11 rounded-xl focus:ring-primary"
              />
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-5 font-bold shadow-lg shadow-primary/20 gap-2"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlus className="w-4 h-4" /> Convidar
            </Button>

          </div>
        </div>

        <ScrollArea className="flex-1 px-8">
          <div className="py-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Carregando Usuários...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 font-medium">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-white/10 group-hover:border-primary/40 transition-colors">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                      <AvatarFallback className="bg-slate-800 text-white font-bold">
                        {user.nome?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{user.nome}</span>
                        {getRoleBadge(user.role)}
                        {user.is_master_admin && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] uppercase tracking-tighter">Master</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Ativo</span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/10 rounded-xl">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-200 rounded-xl p-1.5">
                        <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary">
                          <Shield className="w-4 h-4" /> Editar Cargo
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400">
                          <Trash2 className="w-4 h-4" /> Remover Acesso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-8 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
          <Button variant="outline" onClick={onClose} className="w-full border-white/10 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-12 font-bold">
            Fechar Painel
          </Button>
        </div>

        <InviteModal 
          company={company} 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
        />
      </SheetContent>
    </Sheet>

  );
};
