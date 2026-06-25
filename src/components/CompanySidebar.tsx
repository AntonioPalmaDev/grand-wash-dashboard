import {
  LayoutDashboard,
  Users,
  History,
  Settings,
  DollarSign,
  LogOut,
  FileText,
  PieChart,
  Building2,
  Briefcase,
  Package,
  ShoppingCart,
  Calculator,
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useModules } from "@/context/ModuleContext";
import { useRole } from "@/hooks/useRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const companyItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, moduleKey: "dashboard" },
  { title: "Clientes", url: "/clientes", icon: Users, moduleKey: "clientes" },
  { title: "Gestão de Produtos", url: "/produtos", icon: Package, moduleKey: "produtos" },
  { title: "Operações Financeiras", url: "/operacoes-financeiras", icon: DollarSign, moduleKey: "operacoes_financeiras" },
  { title: "Operações de Produtos", url: "/operacoes-produtos", icon: ShoppingCart, moduleKey: "operacoes_produtos" },
  { title: "Financeiro", url: "/financeiro", icon: Briefcase, moduleKey: "financeiro" },
  { title: "Relatórios", url: "/painel-financeiro", icon: PieChart, moduleKey: "relatorios" },
  { title: "Histórico", url: "/historico", icon: History, moduleKey: "historico" },
  { title: "Logs da Empresa", url: "/logs", icon: FileText, moduleKey: "logs" },
  { title: "Calculadora", url: "/calculator", icon: Calculator, moduleKey: "calculadora" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, moduleKey: "configuracoes" },
  { title: "Usuários", url: "/usuarios", icon: Users, moduleKey: "usuarios" },
];

export function CompanySidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuth();
  const { activeCompany } = useCompany();
  const { role } = useRole();
  const { isModuleEnabled } = useModules();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4">
          <SidebarMenuButton
            size="lg"
            className="border border-border/50 rounded-lg shadow-sm cursor-default"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {activeCompany?.logo_url ? (
                <img
                  src={activeCompany.logo_url}
                  alt={activeCompany.name}
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <Building2 className="size-4" />
              )}
            </div>

            {!collapsed && (
              <div className="flex flex-col gap-0.5 leading-none ml-2 overflow-hidden">
                <span className="font-semibold truncate text-sm">
                  {activeCompany?.name || "Black Dragons"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  Ambiente Interno
                </span>
              </div>
            )}
          </SidebarMenuButton>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="px-4">
            Gestão Empresarial
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {companyItems
                .filter((item) => {
                  if (!isModuleEnabled(item.moduleKey)) return false;
                  if (role === "visualizador") {
                    return (
                      item.url === "/" ||
                      item.url === "/painel-financeiro" ||
                      item.url === "/calculator" ||
                      item.url === "/configuracoes"
                    );
                  }

                  return true;
                })
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/50 rounded-md transition-all"
                        activeClassName="bg-primary/20 text-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)] border-r-4 border-primary !rounded-r-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="text-sm">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="p-3 border-t border-border/50 bg-secondary/20">
          {!collapsed && user && (
            <div className="px-2 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold truncate">
                  {user.email?.split("@")[0]}
                </p>

                <Badge
                  variant="secondary"
                  className="text-[9px] px-1 py-0 h-4 uppercase"
                >
                  {role === "desenvolvedor"
                    ? "DEV"
                    : role === "visualizador"
                      ? "VIEWER"
                      : "ADMIN"}
                </Badge>
              </div>

              <p className="text-[10px] text-muted-foreground truncate">
                {activeCompany?.name || "Black Dragons"}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={signOut}
            className="w-full text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="ml-2 font-medium text-xs">Sair do Sistema</span>
            )}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}