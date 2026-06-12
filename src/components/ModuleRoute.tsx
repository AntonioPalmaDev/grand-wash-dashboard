import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useModules } from "@/context/ModuleContext";

type ModuleRouteProps = {
  moduleKey: string;
  children: ReactNode;
};

export function ModuleRoute({ moduleKey, children }: ModuleRouteProps) {
  const { isModuleEnabled, loadingModules } = useModules();

  if (loadingModules) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          Carregando módulo...
        </p>
      </div>
    );
  }

  if (!isModuleEnabled(moduleKey)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="glass-card border border-white/10 rounded-xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Módulo desativado</h2>
          <p className="text-sm text-muted-foreground">
            Este recurso está temporariamente indisponível.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
