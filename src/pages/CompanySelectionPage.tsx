import React, { useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Building2, 
  Search, 
  Settings, 
  Users, 
  FileText, 
  ShieldCheck, 
  MoreHorizontal, 
  Activity, 
  ArrowRight,
  Filter,
  Globe,
  Lock,
  LayoutDashboard
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CompanySelectionPage = () => {
  const { availableCompanies, switchCompany, createCompany } = useCompany();
  const { isMasterAdmin } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const { error } = await createCompany(newName);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao criar empresa", description: error.message });
    } else {
      toast({ title: "Empresa criada!", description: "Você já pode começar a operar nela." });
      setNewName("");
      setIsCreating(false);
    }
  };

  const filteredCompanies = availableCompanies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-6 sm:p-12 font-sans selection:bg-primary/30">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="w-full max-w-7xl z-10 space-y-12">
        {/* Header Centralizado */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
            <Globe className="w-3 h-3" /> Multi-tenant Ecosystem
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Central de Empresas</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Selecione uma empresa para acessar ou gerencie as configurações do ambiente.
          </p>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in duration-700 delay-200">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Pesquisar ecossistema..." 
              className="w-full bg-white/5 border border-white/10 pl-11 pr-4 h-12 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all rounded-2xl text-sm text-white placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl gap-2 shadow-lg shadow-primary/20 font-bold px-8 h-12">
                <Plus className="w-5 h-5" /> Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-slate-200 sm:rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl font-bold">Criar Nova Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-400 font-medium">Nome da Empresa</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Black Dragons" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary rounded-xl"
                  />
                </div>
                <Button className="w-full h-12 shadow-lg shadow-primary/20 font-bold rounded-xl" onClick={handleCreate}>Confirmar Cadastro</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Grid de Empresas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {filteredCompanies.map((company) => (
            <Card 
              key={company.id} 
              className="group relative border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-primary/40 transition-all cursor-pointer overflow-hidden rounded-[2.5rem] shadow-2xl border-2 flex flex-col min-h-[340px]"
            >
              {/* Subtle Blue Glow on Hover */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              <CardHeader className="p-8 pb-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div 
                      className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{ backgroundColor: `${company.primaryColor}15` }}
                    >
                      <Building2 className="w-8 h-8" style={{ color: company.primaryColor }} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black text-white group-hover:text-primary transition-colors">
                        {company.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-slate-400 py-0 uppercase font-bold tracking-tight">
                          {company.slug}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl w-10 h-10 transition-all">
                        <MoreHorizontal className="w-6 h-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 bg-slate-900 border-white/10 text-slate-200 p-2 rounded-2xl">
                      <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">Gestão do Ambiente</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5 mx-2" />
                      <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary">
                        <Settings className="w-4 h-4" /> <span>Editar Informações</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary">
                        <Users className="w-4 h-4" /> <span>Gerenciar Usuários</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary">
                        <FileText className="w-4 h-4" /> <span>Visualizar Logs</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary">
                        <ShieldCheck className="w-4 h-4" /> <span>Permissões</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5 mx-2" />
                      <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl text-red-400 focus:bg-red-500/10 focus:text-red-400">
                        <Lock className="w-4 h-4" /> <span>Desativar Contexto</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-2 space-y-8 flex-1 flex flex-col relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-1.5 hover:bg-white/10 transition-all duration-300">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                      <Activity className="w-3 h-3 text-green-500" /> Status
                    </p>
                    <p className="text-sm font-bold text-slate-200 uppercase">Ativa</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-1.5 hover:bg-white/10 transition-all duration-300">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                      <Globe className="w-3 h-3 text-primary" /> Contexto
                    </p>
                    <p className="text-sm font-bold text-slate-200 uppercase">Privado</p>
                  </div>
                </div>

                <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-inner group-hover:border-primary/40 transition-colors">
                          <Users className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="border-white/10 hover:bg-white/10 rounded-2xl font-bold px-5 h-11"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger edit or manage
                      }}
                    >
                      Editar
                    </Button>
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 group/btn rounded-2xl px-6 h-11 shadow-lg shadow-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        switchCompany(company.id);
                      }}
                    >
                      Entrar <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Card Especial de Nova Empresa (Sempre o Último) */}
          <button 
            onClick={() => setIsCreating(true)}
            className="group relative flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[340px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_40px_rgba(var(--primary),0.3)]">
              <Plus className="w-10 h-10 text-primary group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-black text-2xl text-white mb-3 tracking-tight">Nova Empresa</h3>
            <p className="text-slate-500 font-medium text-center max-w-[200px]">Expanda seu ecossistema com um novo ambiente isolado.</p>
          </button>
        </div>
      </div>

      <footer className="mt-20 py-12 border-t border-white/5 w-full max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-10">
            <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-help group">
              <ShieldCheck className="w-4 h-4 text-primary transition-transform group-hover:scale-110" /> RLS SECURITY ACTIVE
            </span>
            <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-help group">
              <Activity className="w-4 h-4 text-primary transition-transform group-hover:scale-110" /> SYSTEM OPERATIONAL
            </span>
          </div>
          <div className="flex items-center gap-6">
            <p>© 2026 SAAS HUB ENTERPRISE</p>
            <div className="w-2 h-2 rounded-full bg-white/5" />
            <p className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-white shadow-inner">V2.4.0 STABLE</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanySelectionPage;
