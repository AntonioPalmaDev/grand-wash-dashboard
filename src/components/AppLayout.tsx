import React from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/CompanySidebar";
import { useCompany } from "@/context/CompanyContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calculator } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeCompany } = useCompany();
  const navigate = useNavigate();

  const handleOpenCalculator = () => {
    navigate("/calculator");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CompanySidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/50 px-4 glass-card sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />

              <div className="h-4 w-[1px] bg-border mx-2" />

              <div className="flex items-center gap-2">
                {activeCompany?.logo_url ? (
                  <img
                    src={activeCompany.logo_url}
                    alt={activeCompany.name}
                    className="size-6 object-contain"
                  />
                ) : (
                  <Building2 className="size-4 text-primary" />
                )}

                <span className="text-sm font-bold tracking-tight uppercase">
                  {activeCompany?.name || "Zero Foco"}
                </span>

                <Badge variant="secondary" className="text-[10px]">
                  INTERNAL AREA
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCalculator}
                className="gap-2"
              >
                <Calculator className="size-4" />
                Calculadora
              </Button>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="max-w-[1600px] mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}