import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  TrendingUp, 
  Users, 
  ArrowLeftRight, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  Database,
  ArrowUpRight,
  Plus,
  Search
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface CompanyStats {
  id: string;
  name: string;
  totalOperations: number;
  totalLucro: number;
  totalClients: number;
  active: boolean;
}

const GlobalDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    totalCompanies: number;
    totalGlobalOperations: number;
    totalGlobalLucro: number;
    totalGlobalClients: number;
    companies: CompanyStats[];
  }>({
    totalCompanies: 0,
    totalGlobalOperations: 0,
    totalGlobalLucro: 0,
    totalGlobalClients: 0,
    companies: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGlobalStats() {
      setLoading(true);
      const { data: companies } = await supabase.from("companies").select("*");
      if (!companies) return;

      const companyStats: CompanyStats[] = [];
      let globalOps = 0;
      let globalLucro = 0;
      let globalClients = 0;

      for (const company of companies) {
        const { count: opsCount } = await supabase
          .from("operations")
          .select("*", { count: 'exact', head: true })
          .eq("company_id", company.id)
          .eq("status", "concluido")
          .is("deleted_at", null);

        const { data: lucroData } = await supabase
          .from("operations")
          .select("lucro_liquido")
          .eq("company_id", company.id)
          .eq("status", "concluido")
          .is("deleted_at", null);

        const { count: clientsCount } = await supabase
          .from("clients")
          .select("*", { count: 'exact', head: true })
          .eq("company_id", company.id)
          .is("deleted_at", null);

        const companyLucro = lucroData?.reduce((acc, curr) => acc + Number(curr.lucro_liquido), 0) || 0;

        companyStats.push({
          id: company.id,
          name: company.name,
          totalOperations: opsCount || 0,
          totalLucro: companyLucro,
          totalClients: clientsCount || 0,
          active: company.active
        });

        globalOps += opsCount || 0;
        globalLucro += companyLucro;
        globalClients += clientsCount || 0;
      }

      setStats({
        totalCompanies: companies.length,
        totalGlobalOperations: globalOps,
        totalGlobalLucro: globalLucro,
        totalGlobalClients: globalClients,
        companies: companyStats.sort((a, b) => b.totalLucro - a.totalLucro),
      });
      setLoading(false);
    }

    fetchGlobalStats();
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Activity className="size-8 text-primary animate-pulse" />
        <p className="text-muted-foreground animate-pulse">Carregando métricas globais...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Global</h1>
          <p className="text-muted-foreground">Visão geral de todo o ecossistema SaaS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Activity className="size-4" />
            Status do Sistema
          </Button>
          <Button size="sm" className="gap-2" onClick={() => navigate('/admin/companies')}>
            <Plus className="size-4" />
            Nova Empresa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de Empresas"
          value={stats.totalCompanies.toString()}
          icon={Building2}
          description="Empresas registradas"
          trend={{ value: 12, isPositive: true }}
        />
        <KpiCard
          title="Faturamento Global"
          value={formatCurrency(stats.totalGlobalLucro)}
          icon={DollarSign}
          description="Lucro líquido consolidado"
          variant="primary"
          trend={{ value: 8.4, isPositive: true }}
        />
        <KpiCard
          title="Operações Totais"
          value={stats.totalGlobalOperations.toString()}
          icon={ArrowLeftRight}
          description="Transações concluídas"
        />
        <KpiCard
          title="Usuários Globais"
          value={stats.totalGlobalClients.toString()}
          icon={Users}
          description="Usuários cadastrados"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">Empresas em Destaque</CardTitle>
              <CardDescription>Ranking por performance financeira</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/companies')}>
              Ver todas <ArrowUpRight className="ml-2 size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.companies.slice(0, 5).map((company, index) => (
                <div key={company.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-base">{company.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="size-3" /> {company.totalClients}</span>
                        <span className="flex items-center gap-1"><ArrowLeftRight className="size-3" /> {company.totalOperations}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">{formatCurrency(company.totalLucro)}</p>
                    <Badge variant={company.active ? "secondary" : "outline"} className="text-[10px] py-0">
                      {company.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="size-4 text-primary" />
                Infraestrutura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uso do Banco</span>
                  <span className="font-medium">42%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[42%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consumo de API</span>
                  <span className="font-medium">68%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[68%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">RLS Status</span>
                  <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">Protegido</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Audit Logs</span>
                  <span className="font-medium text-green-500">Ativo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tentativas Login</span>
                  <span className="font-medium">0 nas últimas 24h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GlobalDashboard;
