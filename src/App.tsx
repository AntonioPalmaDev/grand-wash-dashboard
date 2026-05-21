import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { CompanyProvider, useCompany } from "@/context/CompanyContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CompanySelectionPage from "@/pages/CompanySelectionPage";
import ClientsPage from "@/pages/ClientsPage";
import OperationsPage from "@/pages/OperationsPage";
import HistoryPage from "@/pages/HistoryPage";
import FinancePage from "@/pages/FinancePage";
import RankingPage from "@/pages/RankingPage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import AuthPage from "@/pages/AuthPage";
import RestorePage from "@/pages/RestorePage";
import PainelFinanceiroPage from "@/pages/PainelFinanceiroPage";
import AdminMasterPage from "@/pages/AdminMasterPage";
import NotFound from "@/pages/NotFound";
import InvitePage from "@/pages/InvitePage";


// Admin Global Pages
import GlobalDashboard from "@/pages/admin/GlobalDashboard";
// Global Companies Page was merged into CompanySelectionPage

const queryClient = new QueryClient();

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="text-3xl animate-bounce">💰</div>
          <p className="text-muted-foreground text-sm animate-pulse">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <CompanyWrapper />;
}


function CompanyWrapper() {
  const { activeCompany, loading, isGlobalMode } = useCompany();
  const { isMasterAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm animate-pulse">Carregando ecossistema...</p>
      </div>
    );
  }

  // A Central de Empresas é o ponto de entrada para seleção/gestão
  if (!activeCompany || window.location.pathname === "/selecao-empresa") {
    return <CompanySelectionPage />;
  }



  return (
    <AppProvider>

      <AppLayout>
        <Routes>
          {/* Rotas de Empresa */}
          {!isGlobalMode && (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/operacoes" element={<OperationsPage />} />
              <Route path="/historico" element={<HistoryPage />} />
              <Route path="/financeiro" element={<FinancePage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/logs" element={<AuditLogsPage />} />
              <Route path="/restauracoes" element={<RestorePage />} />
              <Route path="/painel-financeiro" element={<PainelFinanceiroPage />} />
              <Route path="/selecao-empresa" element={<CompanySelectionPage />} />
            </>
          )}

          <Route path="/selecao-empresa" element={<CompanySelectionPage />} />

          {/* Rotas Administrativas Globais */}
          {isMasterAdmin && (
            <>
              <Route path="/admin" element={<GlobalDashboard />} />
              <Route path="/admin/companies" element={<CompanySelectionPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/logs" element={<AuditLogsPage />} />
              <Route path="/admin-master" element={<Navigate to="/admin" replace />} />
            </>
          )}

          <Route path="/selecao-empresa" element={<CompanySelectionPage />} />

          <Route path="*" element={<NotFound />} />


        </Routes>
      </AppLayout>
    </AppProvider>
  );
}

const App = () => {
  useEffect(() => {
    // Standard initialization if needed
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
