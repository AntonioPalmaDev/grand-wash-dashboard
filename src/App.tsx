import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { useRole } from "@/hooks/useRole";

import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/ClientsPage";
import ProductsPage from "@/pages/ProductsPage";
import FinancialOperationsPage from "@/pages/FinancialOperationsPage";
import ProductOperationsPage from "@/pages/ProductOperationsPage";
import HistoryPage from "@/pages/HistoryPage";
import FinancePage from "@/pages/FinancePage";
import RankingPage from "@/pages/RankingPage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import AuthPage from "@/pages/AuthPage";
import RestorePage from "@/pages/RestorePage";
import PainelFinanceiroPage from "@/pages/PainelFinanceiroPage";
import MechanicCalculator from "@/pages/MechanicCalculator";
import PublicCalculatorPage from "@/pages/PublicCalculatorPage";
import NotFound from "@/pages/NotFound";
import InvitePage from "@/pages/InvitePage";

const queryClient = new QueryClient();

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="text-3xl animate-bounce">💰</div>
          <p className="text-muted-foreground text-sm animate-pulse">
            Autenticando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <CompanyWrapper />;
}

function CompanyWrapper() {
  const { role } = useRole();

  return (
    <AppProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calculator" element={<MechanicCalculator />} />
          <Route path="/painel-financeiro" element={<PainelFinanceiroPage />} />

          <Route path="/clientes" element={<ClientsPage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route
            path="/operacoes-financeiras"
            element={<FinancialOperationsPage />}
          />
          <Route path="/operacoes-produtos" element={<ProductOperationsPage />} />

          {true && (
            <>
              <Route path="/historico" element={<HistoryPage />} />
              <Route path="/financeiro" element={<FinancePage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/logs" element={<AuditLogsPage />} />
              <Route path="/restauracoes" element={<RestorePage />} />
            </>
          )}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  );
}

const App = () => {
  useEffect(() => {
    // Inicialização padrão, se necessário
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <CompanyProvider>
              <Routes>
                <Route path="/calculadora" element={<PublicCalculatorPage />} />
                <Route path="/invite/:token" element={<InvitePage />} />
                <Route path="*" element={<ProtectedApp />} />
              </Routes>
            </CompanyProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;