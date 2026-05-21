import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Company } from "@/types";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  Info,
  Check,
  ChevronRight,
  Database,
  Users,
  LayoutDashboard,
  Settings,
  RefreshCw
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface PermissionsModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'database', label: 'Banco de Dados', icon: Database },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const PermissionsModal = ({ company, isOpen, onClose }: PermissionsModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Mock permissions state
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    gestao: {
      read: true,
      write: true,
      delete: false,
      admin: false
    },
    colaborador: {
      read: true,
      write: false,
      delete: false,
      admin: false
    }
  });

  const handleToggle = (role: string, permission: string) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role][permission]
      }
    }));
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Sucesso",
        description: "Matriz de permissões atualizada.",
      });
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-slate-200 sm:rounded-3xl max-w-4xl p-0 overflow-hidden">
        <div className="p-8 border-b border-white/5 space-y-2">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" /> Matriz RBAC
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 font-medium">Controle granular de acessos para o ambiente {company?.name}.</p>
        </div>

        <Tabs defaultValue="gestao" className="w-full">
          <div className="px-8 bg-slate-900/50 border-b border-white/5">
            <TabsList className="bg-transparent h-14 gap-8">
              <TabsTrigger value="gestao" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold uppercase tracking-widest text-[10px]">Cargo: Gestão</TabsTrigger>
              <TabsTrigger value="colaborador" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold uppercase tracking-widest text-[10px]">Cargo: Colaborador</TabsTrigger>
              <TabsTrigger value="custom" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold uppercase tracking-widest text-[10px]">Personalizado</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[50vh]">
            <div className="p-8 space-y-8">
              {PERMISSION_MODULES.map((module) => (
                <div key={module.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <module.icon className="w-5 h-5 text-primary" />
                    {module.label}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'read', label: 'Visualizar', icon: Eye, desc: 'Permite ver dados e dashboards' },
                      { id: 'write', label: 'Editar', icon: Edit, desc: 'Permite criar e modificar registros' },
                      { id: 'delete', label: 'Excluir', icon: Trash2, desc: 'Permite remover dados permanentemente' },
                      { id: 'admin', label: 'Admin', icon: ShieldAlert, desc: 'Acesso total a configurações críticas' },
                    ].map((perm) => (
                      <div key={perm.id} className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <perm.icon className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-white">{perm.label}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{perm.desc}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={permissions.gestao[perm.id]} 
                          onCheckedChange={() => handleToggle('gestao', perm.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>

        <div className="p-8 border-t border-white/5 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Info className="w-4 h-4 text-primary" /> Alterações afetam todos os usuários vinculados.
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 h-12 text-slate-400 hover:bg-white/5 hover:text-white">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20 gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar Matriz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
