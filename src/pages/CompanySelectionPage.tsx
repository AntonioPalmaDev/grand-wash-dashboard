
import React, { useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, LayoutDashboard, Users, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const CompanySelectionPage = () => {
  const { availableCompanies, switchCompany, createCompany } = useCompany();
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
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Central de Empresas</h1>
        <p className="text-muted-foreground">Selecione uma empresa para acessar o painel administrativo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {availableCompanies.map((company) => (
          <Card 
            key={company.id} 
            className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden bg-card/50 backdrop-blur-sm"
            onClick={() => switchCompany(company.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{company.name}</CardTitle>
              <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <LayoutDashboard className="w-3 h-3" /> Operações
                    </p>
                    <p className="text-sm font-medium">Ativa</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> Clientes
                    </p>
                    <p className="text-sm font-medium">Gerenciados</p>
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: company.primaryColor }} />
                    <span className="text-xs text-muted-foreground">Sistema Multi-tenant</span>
                  </div>
                  <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                    Acessar →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Card className="border-dashed flex flex-col items-center justify-center p-8 hover:bg-accent/50 transition-colors cursor-pointer min-h-[220px]">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">Adicionar Nova Empresa</p>
              <p className="text-sm text-muted-foreground text-center">Inicie um novo ecossistema completo</p>
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
                />
              </div>
              <Button className="w-full" onClick={handleCreate}>Criar Agora</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pt-8 flex items-center gap-4">
        <div className="px-4 py-2 bg-muted rounded-full flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>SaaS Enterprise Professional</span>
        </div>
      </div>
    </div>
  );
};

export default CompanySelectionPage;
