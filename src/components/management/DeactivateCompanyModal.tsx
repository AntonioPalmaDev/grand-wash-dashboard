import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Lock, ShieldAlert, Loader2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeactivateCompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeactivateCompanyModal = ({ company, isOpen, onClose, onSuccess }: DeactivateCompanyModalProps) => {
  const [confirmationName, setConfirmationName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeactivate = async () => {
    if (!company) return;
    
    if (confirmationName !== company.name) {
      toast({
        variant: "destructive",
        title: "Confirmação incorreta",
        description: "O nome digitado não corresponde ao nome da empresa.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ active: false })
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Ambiente Desativado",
        description: `O contexto ${company.name} foi inativado com sucesso.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao desativar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-red-500/20 text-slate-200 sm:rounded-3xl max-w-md">
        <DialogHeader className="space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <DialogTitle className="text-white text-2xl font-bold text-center">
            Desativar Ambiente?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" /> ATENÇÃO
            </div>
            <p className="text-xs text-red-400/80 leading-relaxed">
              Esta ação desativará o acesso ao ambiente <strong>{company?.name}</strong>. 
              Os dados não serão excluídos, mas nenhum usuário conseguirá entrar neste contexto até que seja reativado.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Digite <span className="text-white">"{company?.name}"</span> para confirmar
            </Label>
            <Input 
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              placeholder="Digite o nome da empresa..."
              className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleDeactivate} 
              disabled={loading || confirmationName !== company?.name}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-500/20 gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              Desativar Contexto
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full rounded-xl h-12 text-slate-400 hover:bg-white/5 hover:text-white">
              Manter Ativo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
