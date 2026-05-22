import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/CompanySidebar";
import { GlobalSidebar } from "@/components/GlobalSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isGlobalMode, activeCompany, switchCompany } = useCompany();
  const { isMasterAdmin } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {isGlobalMode && isMasterAdmin ? <GlobalSidebar /> : <CompanySidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/50 px-4 glass-card sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-border mx-2" />
              <div className="flex items-center gap-2">
                {isGlobalMode ? (
                  <>
                    <Globe className="size-4 text-primary" />
                    <span className="text-sm font-bold tracking-tight">CENTRAL GLOBAL</span>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">ADMIN</Badge>
                  </>
                ) : (
                  <>
                    {activeCompany?.logo_url ? (
                      <img src={activeCompany.logo_url} alt={activeCompany.name} className="size-6 object-contain" />
                    ) : (
                      <Building2 className="size-4 text-primary" />
                    )}
                    <span className="text-sm font-bold tracking-tight uppercase">{activeCompany?.name}</span>
                    <Badge variant="secondary" className="text-[10px]">INTERNAL AREA</Badge>
                  </>
                )}
              </div>
            </div>

            {!isGlobalMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => switchCompany(null)}
                className="text-xs text-muted-foreground hover:text-primary gap-2"
              >
                <ArrowLeft className="size-3" />
                Trocar Empresa / Gestão
              </Button>
            )}
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

