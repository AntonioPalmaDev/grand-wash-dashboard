import { LayoutDashboard, Users, ArrowLeftRight, History, Settings, DollarSign, Trophy, LogOut, FileText, ShieldCheck, RotateCcw } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
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

const baseItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Operações", url: "/operacoes", icon: ArrowLeftRight },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Ranking", url: "/ranking", icon: Trophy },
];

const devItems = [
  { title: "Usuários", url: "/usuarios", icon: ShieldCheck },
  { title: "Logs", url: "/logs", icon: FileText },
  { title: "Restaurações", url: "/restauracoes", icon: RotateCcw },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuth();
  const { role, isDev } = useRole();
  const collapsed = state === "collapsed";

  const items = [...baseItems, ...(isDev ? devItems : [])];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4">
          {!collapsed && (
            <h1 className="text-lg font-bold gradient-text tracking-tight">
              <img src="zerofoco4.png" alt="Zero Foco" className="h-10 w-10 inline-block mr-2" />
              Zero Foco
            </h1>
          )}
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
