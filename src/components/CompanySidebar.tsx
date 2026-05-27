import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  History, 
  Settings, 
  DollarSign, 
  Trophy, 
  LogOut, 
  FileText, 
  ShieldCheck, 
  RotateCcw, 
  PieChart, 
  Building2, 
  ChevronDown, 
  Globe,
  Briefcase,
  Zap,
  Bot,
  Package
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useRole } from "@/hooks/useRole";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Gestão de Produtos", url: "/produtos", icon: Package, onlyFor: ["Black Dragons"] },
  { title: "Operações", url: "/operacoes", icon: ArrowLeftRight },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Relatórios", url: "/painel-financeiro", icon: PieChart },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Logs da Empresa", url: "/logs", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function CompanySidebar() {
  const { state } = useSidebar();
  const { signOut, user, isMasterAdmin } = useAuth();
  const { activeCompany, availableCompanies, switchCompany } = useCompany();
  const { role, isDev } = useRole();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="hover:bg-accent transition-colors border border-border/50 rounded-lg shadow-sm">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {activeCompany?.logo_url ? (
                    <img src={activeCompany.logo_url} alt={activeCompany.name} className="h-6 w-6 object-contain" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <div className="flex flex-col gap-0.5 leading-none ml-2 overflow-hidden">
                      <span className="font-semibold truncate text-sm">{activeCompany?.name || "Empresa"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Ambiente Interno</span>
                    </div>
                    <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
              <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trocar Empresa</div>
              {availableCompanies.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => switchCompany(c.id)} className="flex items-center gap-2 cursor-pointer py-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.primaryColor }} />
                  <span className={c.id === activeCompany?.id ? "font-bold" : ""}>{c.name}</span>
                </DropdownMenuItem>
              ))}
              
              {isMasterAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => switchCompany(null)} className="flex items-center gap-2 cursor-pointer text-primary py-2 font-medium">
                    <Globe className="size-4" />
                    <span>Trocar Empresa / Gestão</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="px-4">Gestão Empresarial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {companyItems
                .filter(item => {
                  if (role === "visualizador") {
                    // Only Dashboard and Reports (Financial Panel) for anonymous users
                    return item.url === "/" || item.url === "/painel-financeiro";
                  }
                  
                  // Regra para itens específicos de empresa
                  const companyItem = item as any;
                  if (companyItem.onlyFor && activeCompany) {
                    return companyItem.onlyFor.includes(activeCompany.name);
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
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-sm border-r-2 border-primary !rounded-r-none"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
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
                <p className="text-xs font-semibold truncate">{user.email?.split('@')[0]}</p>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 uppercase">
                  {role === "desenvolvedor" ? "DEV" : role === "visualizador" ? "VIEWER" : "ADMIN"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{activeCompany?.name}</p>
            </div>
          )}
          <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={signOut} className="w-full text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2 font-medium text-xs">Sair do Sistema</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

