import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useModules } from "@/context/ModuleContext";

type ModuleSetting = {
  id: string;
  module_key: string;
  module_name: string;
  enabled: boolean;
};

export function ModuleSettingsPanel() {
  const [modules, setModules] = useState<ModuleSetting[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadModules() {
    setLoading(true);

    const { data, error } = await supabase
      .from("module_settings")
      .select("id, module_key, module_name, enabled")
      .order("module_name", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar páginas.");
      setLoading(false);
      return;
    }

    setModules(data || []);
    setLoading(false);
  }

  async function toggleModule(id: string, enabled: boolean) {
    setModules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled } : item))
    );

    const { error } = await supabase
      .from("module_settings")
      .update({ enabled })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar página.");
      loadModules();
      return;
    }

    toast.success(enabled ? "Página ativada." : "Página ocultada.");
  }

  useEffect(() => {
    loadModules();
  }, []);

  return (
    <div className="glass-card p-6 rounded-xl space-y-4 border border-white/5">
      <div>
        <h2 className="text-lg font-semibold">Controle de Páginas</h2>
        <p className="text-sm text-muted-foreground">
          Ative ou oculte páginas do menu lateral do sistema.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Carregando páginas...</p>
      )}

      {!loading && modules.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma página cadastrada.
        </p>
      )}

      {!loading &&
        modules.map((module) => (
          <div
            key={module.id}
            className="flex items-center justify-between rounded-lg border border-white/10 p-4"
          >
            <div>
              <p className="font-medium">{module.module_name}</p>
              <p className="text-xs text-muted-foreground">
                {module.module_key}
              </p>
            </div>

            <Switch
              checked={module.enabled}
              onCheckedChange={(checked) => toggleModule(module.id, checked)}
            />
          </div>
        ))}
    </div>
  );
}