import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import { useState } from "react";

export default function PendingApprovalPage() {
  const { signOut, refreshStatus, userStatus } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await refreshStatus();
    setChecking(false);
  };

  const isRejected = userStatus === "rejeitado";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card rounded-xl p-8 w-full max-w-md space-y-6 text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isRejected ? "bg-destructive/20" : "bg-primary/20"}`}>
          <Clock className={`h-8 w-8 ${isRejected ? "text-destructive" : "text-primary"}`} />
        </div>
        
        <h1 className="text-2xl font-bold">
          {isRejected ? "Acesso Negado" : "Aguardando Aprovação"}
        </h1>
        
        <p className="text-muted-foreground">
          {isRejected
            ? "Sua solicitação de acesso foi rejeitada por um administrador. Entre em contato para mais informações."
            : "Sua conta foi criada com sucesso! Um desenvolvedor precisa aprovar seu acesso antes que você possa utilizar o sistema."}
        </p>

        <div className="flex flex-col gap-3">
          {!isRejected && (
            <Button onClick={handleCheck} disabled={checking} variant="outline" className="w-full">
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Verificando..." : "Verificar status"}
            </Button>
          )}
          <Button onClick={signOut} variant="ghost" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
