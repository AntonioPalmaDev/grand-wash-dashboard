import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { ModuleProvider } from "@/context/ModuleContext";

import { AppLayout } from "@/components/AppLayout";
import { ModuleRoute } from "@/components/ModuleRoute";
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
  const { user, loading, userStatus } = useAuth();
console.log("STATUS DO USUÁRIO:", userStatus);
  console.log("USUÁRIO:", user?.email);
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

  if (userStatus !== "aprovado") {
  const isRejected = userStatus === "rejeitado";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div
        className={`max-w-md w-full glass-card rounded-xl p-6 text-center space-y-4 border ${
          isRejected ? "border-red-500/20" : "border-white/10"
        }`}
      >
        <div className="text-4xl">{isRejected ? "🚫" : "⏳"}</div>

        <h1 className="text-2xl font-bold">
          {isRejected ? "Acesso Rejeitado" : "Aguardando Aprovação"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {isRejected
            ? "Seu cadastro foi rejeitado por um administrador."
            : "Seu cadastro foi realizado com sucesso. Aguarde um administrador aprovar seu acesso."}
        </p>
      </div>
    </div>
  );
}


  return <CompanyWrapper />;
}
function CompanyWrapper() {
  

  return (
    <AppProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ModuleRoute moduleKey="dashboard"><Dashboard /></ModuleRoute>} />
          <Route path="/calculator" element={<ModuleRoute moduleKey="calculadora"><MechanicCalculator /></ModuleRoute>} />
          <Route path="/painel-financeiro" element={<ModuleRoute moduleKey="relatorios"><PainelFinanceiroPage /></ModuleRoute>} />

          <Route path="/clientes" element={<ModuleRoute moduleKey="clientes"><ClientsPage /></ModuleRoute>} />
          <Route path="/produtos" element={<ModuleRoute moduleKey="produtos"><ProductsPage /></ModuleRoute>} />
          <Route
            path="/operacoes-financeiras"
            element={<ModuleRoute moduleKey="operacoes_financeiras"><FinancialOperationsPage /></ModuleRoute>}
          />
          <Route path="/operacoes-produtos" element={<ModuleRoute moduleKey="operacoes_produtos"><ProductOperationsPage /></ModuleRoute>} />

          <Route path="/historico" element={<ModuleRoute moduleKey="historico"><HistoryPage /></ModuleRoute>} />
          <Route path="/financeiro" element={<ModuleRoute moduleKey="financeiro"><FinancePage /></ModuleRoute>} />
          <Route path="/ranking" element={<ModuleRoute moduleKey="ranking"><RankingPage /></ModuleRoute>} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/usuarios" element={<ModuleRoute moduleKey="usuarios"><UsersPage /></ModuleRoute>} />
          <Route path="/logs" element={<ModuleRoute moduleKey="logs"><AuditLogsPage /></ModuleRoute>} />
          <Route path="/restauracoes" element={<RestorePage />} />

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
              <ModuleProvider>
                <Routes>
                  <Route path="/calculadora" element={<PublicCalculatorPage />} />
                  <Route path="/invite/:token" element={<InvitePage />} />
                  <Route path="*" element={<ProtectedApp />} />
                </Routes>
              </ModuleProvider>
            </CompanyProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;