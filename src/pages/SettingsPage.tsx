import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { isDev } = useRole();
  
  if (!isDev) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a Desenvolvedores</p>
      </div>
    );
  }
  const { config, updateConfig } = useApp();
  const [taxaPF, setTaxaPF] = useState(String(config.taxaPF));
  const [taxaPJ, setTaxaPJ] = useState(String(config.taxaPJ));
  const [taxaMaquina, setTaxaMaquina] = useState(String(config.taxaMaquina));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateConfig({
      taxaPF: Number(taxaPF) || 30,
      taxaPJ: Number(taxaPJ) || 25,
      taxaMaquina: Number(taxaMaquina) || 10,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <div className="glass-card rounded-lg p-6 space-y-5">
        <div>
          <Label>Taxa Padrão PF (%)</Label>
          <Input type="number" value={taxaPF} onChange={e => setTaxaPF(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Aplicada a clientes Pessoa Física sem taxa personalizada</p>
        </div>
        <div>
          <Label>Taxa Padrão PJ (%)</Label>
          <Input type="number" value={taxaPJ} onChange={e => setTaxaPJ(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Aplicada a Facções/Empresas parceiras sem taxa personalizada</p>
        </div>
        <div>
          <Label>Taxa da Máquina (%)</Label>
          <Input type="number" value={taxaMaquina} onChange={e => setTaxaMaquina(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Custo operacional fixo sobre cada operação</p>
        </div>
        <Button onClick={handleSave} className="w-full">
          {saved ? "✓ Salvo!" : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
