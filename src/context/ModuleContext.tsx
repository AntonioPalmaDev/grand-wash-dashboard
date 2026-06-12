import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export type ModuleSetting = {
  id: string;
  module_key: string;
  module_name: string;
  enabled: boolean;
};

type ModuleContextType = {
  modules: ModuleSetting[];
  loadingModules: boolean;
  isModuleEnabled: (moduleKey: string) => boolean;
  refreshModules: () => Promise<void>;
};

const ModuleContext = createContext<ModuleContextType | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<ModuleSetting[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  const refreshModules = useCallback(async () => {
    const { data, error } = await supabase
      .from("module_settings")
      .select("id, module_key, module_name, enabled");

    if (!error && data) {
      setModules(data as ModuleSetting[]);
    }
    setLoadingModules(false);
  }, []);

  useEffect(() => {
    refreshModules();
  }, [refreshModules]);

  const isModuleEnabled = useCallback(
    (moduleKey: string) => {
      // Configurações sempre disponível para evitar lock-out
      if (moduleKey === "configuracoes") return true;
      const found = modules.find((m) => m.module_key === moduleKey);
      if (!found) return true; // default true se não cadastrado
      return found.enabled;
    },
    [modules]
  );

  return (
    <ModuleContext.Provider
      value={{ modules, loadingModules, isModuleEnabled, refreshModules }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModules must be used within ModuleProvider");
  return ctx;
}
