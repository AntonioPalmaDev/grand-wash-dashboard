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
  Lock
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
  const { availableCompanies, switchCompany, createCompany, isGlobalMode } = useCompany();
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

  // Se estiver no modo global (com sidebar), removemos o header fixo e o fundo escuro total
  const content = (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h2>
          <p className="text-muted-foreground max-w-md">Administre e monitore todos os tenants do ecossistema SaaS.</p>
        </div>
        
        {!isGlobalMode && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground font-medium">Status Global</span>
              <span className="text-green-500 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operacional
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground font-medium">Empresas</span>
              <span className="font-bold">{availableCompanies.length}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Buscar empresa..." 
              className="bg-background border border-border pl-10 h-10 focus:outline-none focus:ring-1 focus:ring-primary transition-all rounded-lg text-sm w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm font-semibold">
                <Plus className="w-4 h-4" /> Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Black Dragons" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate}>Confirmar Cadastro</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Especial de Nova Empresa */}
        <button 
          onClick={() => setIsCreating(true)}
          className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[300px] overflow-hidden"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-primary group-hover:text-primary-foreground">
            <Plus className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-xl mb-2">Adicionar Empresa</h3>
          <p className="text-muted-foreground text-sm text-center max-w-[200px]">Expanda seu ecossistema com um novo ambiente.</p>
        </button>

        {filteredCompanies.map((company) => (
          <Card 
            key={company.id} 
            className="group relative border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-md flex flex-col min-h-[300px]"
            onClick={() => switchCompany(company.id)}
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-border/50 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${company.primaryColor}10` }}
                  >
                    <Building2 className="w-7 h-7" style={{ color: company.primaryColor }} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      {company.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] py-0 uppercase tracking-tighter">
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
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent rounded-xl">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Ações de Gestão</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" /> Editar Informações
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Users className="w-4 h-4" /> Gerenciar Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <FileText className="w-4 h-4" /> Visualizar Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <ShieldCheck className="w-4 h-4" /> Permissões
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer text-destructive">
                      <Lock className="w-4 h-4" /> Desativar Empresa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-1 hover:bg-secondary/30 transition-colors">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> Status
                  </p>
                  <p className="text-sm font-bold">Operacional</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-1 hover:bg-secondary/30 transition-colors">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Segurança
                  </p>
                  <p className="text-sm font-bold">Protegido</p>
                </div>
              </div>

              <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                        {i === 3 ? <Plus className="w-3 h-3" /> : <Users className="w-3.5 h-3.5" />}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Ecossistema</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="text-primary hover:bg-primary/10 hover:text-primary font-bold gap-2 group/btn rounded-xl px-4"
                >
                  Acessar <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isGlobalMode) {
    return <div className="p-6">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Central de Empresas</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Plataforma SaaS Enterprise</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">AMBIENTE GLOBAL</Badge>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {content}
      </main>
      <footer className="py-8 border-t border-white/5 bg-slate-950/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <p>© 2026 SaaS Enterprise Platform</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Security Verified</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> High Availability</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanySelectionPage;
