import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Plus, Search, Filter, ArrowUpRight, ArrowLeftRight, Users, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCompany } from "@/context/CompanyContext";
import { formatCurrency } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface CompanyWithStats {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  active: boolean;
  totalLucro: number;
  totalOps: number;
}

const GlobalCompaniesPage = () => {
  const { switchCompany, createCompany } = useCompany();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const { toast } = useToast();

  const fetchCompanies = async () => {
    setLoading(true);
    const { data: companiesData } = await supabase.from("companies").select("*");
    
    if (companiesData) {
      const withStats = await Promise.all(companiesData.map(async (c) => {
        const { data: lucroData } = await supabase
          .from("operations")
          .select("lucro_liquido")
          .eq("company_id", c.id)
          .eq("status", "concluido");
        
        const { count } = await supabase
          .from("operations")
          .select("*", { count: 'exact', head: true })
          .eq("company_id", c.id);

        const totalLucro = lucroData?.reduce((acc, curr) => acc + Number(curr.lucro_liquido), 0) || 0;
        
        return {
          ...c,
          totalLucro,
          totalOps: count || 0
        };
      }));
      setCompanies(withStats);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const { error } = await createCompany(newName);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao criar empresa", description: error.message });
    } else {
      toast({ title: "Empresa criada!", description: "A nova empresa foi adicionada ao ecossistema." });
      setNewName("");
      setIsCreating(false);
      fetchCompanies();
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h1>
          <p className="text-muted-foreground">Administre todos os tenants do ecossistema</p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Nova Empresa
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
              <Button className="w-full" onClick={handleCreate}>Criar Agora</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar empresa..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="group hover:border-primary/50 transition-all shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <CardDescription>{company.slug}</CardDescription>
                  </div>
                </div>
                <Badge variant={company.active ? "secondary" : "outline"}>
                  {company.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Lucro Total</p>
                  <p className="font-bold text-sm text-primary">{formatCurrency(company.totalLucro)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Operações</p>
                  <p className="font-bold text-sm">{company.totalOps}</p>
                </div>
              </div>
              
              <Button 
                className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground" 
                variant="outline"
                onClick={() => switchCompany(company.id)}
              >
                Acessar Empresa <ExternalLink className="size-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GlobalCompaniesPage;
