import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import MechanicCalculator from "@/pages/MechanicCalculator";
import CalculatorGuard, { clearCalculatorAccess } from "@/components/CalculatorGuard";

export default function PublicCalculatorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Calculadora Mecânica | Grand Wash Dashboard";
  }, []);

  const handleLogout = () => {
    clearCalculatorAccess();
    navigate(0);
  };

  return (
    <CalculatorGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-14 border-b border-border/50 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Calculator className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">Calculadora Mecânica</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Acesso por Token</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair da Calculadora</span>
            <span className="sm:hidden">Sair</span>
          </Button>
        </header>

        <main className="flex-1 overflow-auto">
          <MechanicCalculator />
        </main>
      </div>
    </CalculatorGuard>
  );
}
