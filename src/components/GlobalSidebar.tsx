import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  History, 
  Settings, 
  ShieldCheck, 
  PieChart, 
  Database, 
  Activity, 
  CreditCard, 
  LogOut, 
  ChevronRight,
  Monitor,
  Lock,
  Globe
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
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
import { Badge } from "@/components/ui/badge";

const globalItems = [
  { title: "Métricas Globais", url: "/admin", icon: PieChart },
  { title: "Central de Empresas", url: "/admin/companies", icon: Building2 },
  { title: "Usuários Globais", url: "/admin/users", icon: Users },
  { title: "Logs do Sistema", url: "/admin/logs", icon: FileText },
  { title: "Métricas Gerais", url: "/admin/metrics", icon: PieChart },
  { title: "Financeiro Global", url: "/admin/finance", icon: CreditCard },
  { title: "Auditoria", url: "/admin/audit", icon: ShieldCheck },
  { title: "Monitoramento", url: "/admin/monitor", icon: Activity },
  { title: "Banco de Dados", url: "/admin/database", icon: Database },
  { title: "Segurança", url: "/admin/security", icon: Lock },
  { title: "APIs", url: "/admin/api", icon: Monitor },
  { title: "Configurações Globais", url: "/admin/settings", icon: Settings },
];

export function GlobalSidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuth();
  const { canAccessAdmin, role } = useRole();
  const collapsed = state === "collapsed";

  if (!canAccessAdmin) return null;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-slate-950 text-slate-200">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="size-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white">CENTRAL GLOBAL</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Platform Admin</span>
            </div>
          )}
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-slate-500 font-semibold px-4">Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {globalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all group"
                      activeClassName="bg-primary/10 text-primary border-l-2 border-primary !rounded-l-none"
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="p-3 mt-auto border-t border-white/5 bg-slate-950/50">
          {!collapsed && user && (
            <div className="px-2 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Logado como</p>
              <p className="text-xs text-white font-medium truncate">{user.email}</p>
              <Badge variant="outline" className="mt-2 text-[9px] border-primary/30 text-primary bg-primary/5 py-0 uppercase">
                {role?.replace("_", " ") || "ADMIN"}
              </Badge>
            </div>
          )}
          <Button 
            variant="ghost" 
            size={collapsed ? "icon" : "sm"} 
            onClick={signOut} 
            className="w-full text-slate-400 hover:text-white hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2 font-medium">Encerrar Sessão</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
