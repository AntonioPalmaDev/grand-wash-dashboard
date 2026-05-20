
import React, { useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, LayoutDashboard, Users, TrendingUp, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const CompanySelectionPage = () => {
  const { availableCompanies, switchCompany, createCompany } = useCompany();
  const { isMasterAdmin } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8">
      <div className="text-center space-y-2 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Central de Empresas</h1>
        <p className="text-muted-foreground text-lg">Selecione uma empresa para gerenciar ou acesse o painel global da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {isMasterAdmin && (
          <Card 
            className="group border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer overflow-hidden border-2"
            onClick={() => navigate('/admin')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold text-primary">Painel Global</CardTitle>
              <ShieldCheck className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground font-medium">Administração mestre de todas as empresas, usuários e logs do sistema.</p>
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">MASTER ACCESS</span>
                  <Button variant="link" className="text-primary p-0 h-auto">Acessar Central →</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {availableCompanies.map((company) => (
          <Card 
            key={company.id} 
            className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm"
            onClick={() => switchCompany(company.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold truncate pr-2">{company.name}</CardTitle>
              <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" /> Ativa
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Contexto</p>
                    <p className="text-sm font-medium">Privado</p>
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-between border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: company.primaryColor }} />
                    <span className="text-xs text-muted-foreground font-medium">Ecossistema</span>
                  </div>
                  <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform text-primary hover:text-primary hover:bg-primary/5">
                    Entrar →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Card className="border-dashed flex flex-col items-center justify-center p-8 hover:bg-accent/50 transition-colors cursor-pointer min-h-[220px] group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-lg">Nova Empresa</p>
              <p className="text-sm text-muted-foreground text-center">Expanda o ecossistema SaaS</p>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Black Dragons" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="focus-visible:ring-primary"
                />
              </div>
              <Button className="w-full shadow-lg shadow-primary/20" onClick={handleCreate}>Confirmar Cadastro</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pt-8">
        <div className="px-6 py-3 bg-muted/50 backdrop-blur-md rounded-full border border-border/50 flex items-center gap-3 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-medium">Infraestrutura Multi-tenant Ativa & Segura</span>
        </div>
      </div>
    </div>
  );
};

export default CompanySelectionPage;

