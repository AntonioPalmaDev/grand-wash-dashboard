import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/ClientsPage";
import OperationsPage from "@/pages/OperationsPage";
import HistoryPage from "@/pages/HistoryPage";
import FinancePage from "@/pages/FinancePage";
import RankingPage from "@/pages/RankingPage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import AuthPage from "@/pages/AuthPage";
import PendingApprovalPage from "@/pages/PendingApprovalPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedApp() {
  const { user, loading, userStatus } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="text-3xl">💰</div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (userStatus !== "aprovado") return <PendingApprovalPage />;

  return (
    <AppProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientsPage />} />
          <Route path="/operacoes" element={<OperationsPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/financeiro" element={<FinancePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/logs" element={<AuditLogsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ProtectedApp />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
