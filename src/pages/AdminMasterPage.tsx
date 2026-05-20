
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, Users, ArrowLeftRight, DollarSign } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency } from "@/lib/utils";

interface CompanyStats {
  id: string;
  name: string;
  totalOperations: number;
  totalLucro: number;
  totalClients: number;
}

const AdminMasterPage = () => {
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
      // Busca todas as empresas
      const { data: companies } = await supabase.from("companies").select("id, name");
      
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

  if (loading) return <div className="p-8">Carregando dados globais...</div>;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Painel Admin Master</h1>
        <p className="text-muted-foreground">Visão consolidada de todo o ecossistema SaaS</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de Empresas"
          value={stats.totalCompanies.toString()}
          icon={Building2}
          description="Empresas ativas no sistema"
        />
        <KpiCard
          title="Faturamento Global"
          value={formatCurrency(stats.totalGlobalLucro)}
          icon={DollarSign}
          description="Lucro líquido total de todas as empresas"
          trend="+12% em relação ao mês anterior"
        />
        <KpiCard
          title="Operações Totais"
          value={stats.totalGlobalOperations.toString()}
          icon={ArrowLeftRight}
          description="Operações concluídas em todo o sistema"
        />
        <KpiCard
          title="Total de Clientes"
          value={stats.totalGlobalClients.toString()}
          icon={Users}
          description="Clientes cadastrados globalmente"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Ranking de Empresas por Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats.companies.map((company, index) => (
              <div key={company.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.totalClients} clientes | {company.totalOperations} operações</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-primary">{formatCurrency(company.totalLucro)}</p>
                  <p className="text-xs text-muted-foreground font-medium">Lucro Líquido</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMasterPage;
