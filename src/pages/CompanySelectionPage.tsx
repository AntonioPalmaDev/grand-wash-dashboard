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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header Centralizado */}
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Central de Empresas</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Painel Administrativo Global</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Pesquisar ecossistema, empresas ou ambientes..." 
              className="w-full bg-white/5 border border-white/10 pl-10 h-11 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all rounded-xl text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-400">
              <Filter className="w-4 h-4" />
            </Button>
            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20 font-semibold px-5">
                  <Plus className="w-4 h-4" /> Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Nova Empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-400">Nome da Empresa</Label>
                    <Input 
                      id="name" 
                      placeholder="Ex: Black Dragons" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus-visible:ring-primary"
                    />
                  </div>
                  <Button className="w-full shadow-lg shadow-primary/20" onClick={handleCreate}>Confirmar Cadastro</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-white tracking-tight">Ambientes Ativos</h2>
            <p className="text-slate-400 max-w-md">Gerencie e monitore o desempenho de cada empresa do ecossistema a partir desta central mestra.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-slate-500 font-medium">Status Global</span>
              <span className="text-green-500 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operacional
              </span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-slate-500 font-medium">Total de Empresas</span>
              <span className="text-white font-bold">{availableCompanies.length}</span>
            </div>
          </div>
        </div>

        {/* Grid de Empresas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Especial de Nova Empresa */}
          <button 
            onClick={() => setIsCreating(true)}
            className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[320px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-primary group-hover:text-primary-foreground">
              <Plus className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-bold text-xl text-white mb-2">Adicionar Empresa</h3>
            <p className="text-slate-500 text-sm text-center max-w-[200px]">Expanda seu ecossistema SaaS com um novo ambiente isolado.</p>
          </button>

          {filteredCompanies.map((company) => (
            <Card 
              key={company.id} 
              className="group relative border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-primary/40 transition-all cursor-pointer overflow-hidden rounded-2xl shadow-xl hover:shadow-primary/5 border flex flex-col min-h-[320px]"
              onClick={() => switchCompany(company.id)}
            >
              {/* Glow Efeito Azul Discreto */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${company.primaryColor}15` }}
                    >
                      <Building2 className="w-7 h-7" style={{ color: company.primaryColor }} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                        {company.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-slate-400 py-0 uppercase tracking-tighter">
                          {company.slug}
                        </Badge>
                        <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ativa
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/10 rounded-xl">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-slate-200">
                      <DropdownMenuLabel>Ações de Gestão</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <Settings className="w-4 h-4" /> Editar Informações
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <Users className="w-4 h-4" /> Gerenciar Usuários
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <FileText className="w-4 h-4" /> Visualizar Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <ShieldCheck className="w-4 h-4" /> Permissões
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem className="gap-2 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400">
                        <Lock className="w-4 h-4" /> Desativar Contexto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-6 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> Status
                    </p>
                    <p className="text-sm font-bold text-slate-200">Operacional</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1 hover:bg-white/10 transition-colors">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" /> Segurança
                    </p>
                    <p className="text-sm font-bold text-slate-200">RLS Ativo</p>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-inner">
                          {i === 3 ? <Plus className="w-3 h-3" /> : <Users className="w-3.5 h-3.5" />}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Equipe Interna</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:bg-primary/10 hover:text-primary font-bold gap-2 group/btn rounded-xl px-4"
                  >
                    Entrar <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="py-8 border-t border-white/5 bg-slate-950/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-help">
              <ShieldCheck className="w-4 h-4 text-primary/60" /> Multi-tenant Infrastructure
            </span>
            <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-help">
              <Activity className="w-4 h-4 text-primary/60" /> Real-time Performance Monitor
            </span>
          </div>
          <div className="flex items-center gap-4">
            <p>© 2026 SaaS Enterprise Hub</p>
            <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
            <p className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10">v2.4.0-stable</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanySelectionPage;
