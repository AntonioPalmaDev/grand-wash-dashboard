import { LayoutDashboard, Users, ArrowLeftRight, History, Settings, DollarSign, Trophy, LogOut, FileText, ShieldCheck, RotateCcw, ClipboardList, PieChart, Building2, ChevronDown, Plus } from "lucide-react";
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

const baseItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Operações", url: "/operacoes", icon: ArrowLeftRight },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  
];

const devItems = [
  { title: "Painel Financeiro", url: "/painel-financeiro", icon: PieChart },
  { title: "Logs", url: "/logs", icon: FileText },
  { title: "Restaurações", url: "/restauracoes", icon: RotateCcw },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const masterItems = [
  { title: "Admin Master", url: "/admin-master", icon: ShieldCheck },
];

const adminItems = [
  { title: "Usuários", url: "/usuarios", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user, isMasterAdmin } = useAuth();
  const { activeCompany, availableCompanies, switchCompany } = useCompany();
  const { role, isDev } = useRole();
  const collapsed = state === "collapsed";

  const items = [
    ...baseItems, 
    ...(isDev || isMasterAdmin ? adminItems : []),
    ...(isDev ? devItems : []),
    ...(isMasterAdmin ? masterItems : [])
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="hover:bg-accent transition-colors">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {activeCompany?.logo ? (
                    <img src={activeCompany.logo} alt={activeCompany.name} className="h-6 w-6 object-contain" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <div className="flex flex-col gap-0.5 leading-none ml-2 overflow-hidden">
                      <span className="font-semibold truncate">{activeCompany?.name || "Empresa"}</span>
                      <span className="text-xs text-muted-foreground">Trocar ecossistema</span>
                    </div>
                    <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Minhas Empresas</div>
              {availableCompanies.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => switchCompany(c.id)} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.primaryColor }} />
                  <span className={c.id === activeCompany?.id ? "font-bold" : ""}>{c.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/selecao-empresa'} className="flex items-center gap-2 cursor-pointer text-primary">
                <LayoutDashboard className="size-4" />
                <span>Central de Empresas</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-secondary/50 transition-colors"
                      activeClassName="bg-primary/15 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="p-3 border-t border-border/50">
          {!collapsed && user && (
            <div className="px-2 mb-2 space-y-1">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <Badge variant={isDev ? "default" : "secondary"} className="text-[10px]">
                {role === "desenvolvedor" ? "Desenvolvedor" : "Gestão"}
              </Badge>
            </div>
          )}
          <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={signOut} className="w-full text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
