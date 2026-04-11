import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

export default function SettingsPage() {
  const { config, updateConfig } = useApp();
  
  // Estado local para o formulário
  const [formData, setFormData] = useState(config);

  async function handleSave() {
    try {
      await updateConfig(formData);
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <ChangePasswordDialog />
      </div>
      
      <div className="glass-card p-6 rounded-xl space-y-4 border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Taxa Padrão PF (%)</Label>
            <Input 
              type="number" 
              value={formData.taxaPF} 
              onChange={e => setFormData({...formData, taxaPF: Number(e.target.value)})}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Taxa Padrão PJ (%)</Label>
            <Input 
              type="number" 
              value={formData.taxaPJ} 
              onChange={e => setFormData({...formData, taxaPJ: Number(e.target.value)})}
            />
          </div>

          <div className="space-y-2">
            <Label>Custo de Máquina (%)</Label>
            <Input 
              type="number" 
              value={formData.taxaMaquina} 
              onChange={e => setFormData({...formData, taxaMaquina: Number(e.target.value)})}
            />
          </div>

          {/* NOVO CAMPO: MARGEM LÍQUIDA */}
          <div className="space-y-2">
            <Label>Meta de Margem Líquida (%)</Label>
            <Input 
              type="number" 
              value={formData.taxaLiquida} 
              onChange={e => setFormData({...formData, taxaLiquida: Number(e.target.value)})}
              className="border-emerald-500/30 focus:border-emerald-500"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 mt-4">
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}