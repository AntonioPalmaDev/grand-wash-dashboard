import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Copy, 
  Check, 
  Link as LinkIcon, 
  Clock, 
  Shield, 
  Mail, 
  Loader2,
  Share2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface InviteModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal = ({ company, isOpen, onClose }: InviteModalProps) => {
  const { user } = useAuth();
  const [role, setRole] = useState("membro");
  const [validity, setValidity] = useState("7");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateInvite = async () => {
    if (!company || !user) return;
    
    setLoading(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(validity));

      const { error } = await supabase
        .from("invitations")
        .insert({
          company_id: company.id,
          token: token,
          role: role,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
          status: 'pending'
        });

      if (error) throw error;

      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      
      toast({
        title: "Convite gerado!",
        description: "O link já está disponível para cópia.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar convite",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "O link foi copiado para sua área de transferência.",
      });
    }
  };

  const resetAndClose = () => {
    setInviteLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-slate-200 sm:rounded-[2rem] max-w-md overflow-hidden p-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary" />
        
        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Share2 className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">Convidar para {company?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Gere um link único para convidar novos membros para este ambiente.
            </DialogDescription>
          </DialogHeader>

          {!inviteLink ? (
            <div className="space-y-6 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Cargo do Membro
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-slate-200">
                      <SelectItem value="membro">Membro (Desenvolvedor)</SelectItem>
                      <SelectItem value="gestor">Gestor (Gestão)</SelectItem>
                      <SelectItem value="admin">Administrador (Gestão Total)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Validade do Link
                  </Label>
                  <Select value={validity} onValueChange={setValidity}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary">
                      <SelectValue placeholder="Selecione a validade" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-slate-200">
                      <SelectItem value="1">24 Horas</SelectItem>
                      <SelectItem value="7">7 Dias</SelectItem>
                      <SelectItem value="30">30 Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all"
                onClick={generateInvite}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
                Gerar Link Seguro
              </Button>
            </div>
          ) : (
            <div className="space-y-6 pt-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-6 rounded-2xl bg-white/5 border border-primary/20 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Link de Convite Ativo</p>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={inviteLink}
                    className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-xs font-medium"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`shrink-0 h-11 w-11 rounded-xl transition-all ${copied ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'}`}
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500 text-center italic">
                  Este link expira em {validity} {parseInt(validity) === 1 ? 'dia' : 'dias'}.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold"
                onClick={() => setInviteLink(null)}
              >
                Gerar Outro Link
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="w-full text-slate-500 hover:text-white hover:bg-white/5 font-bold rounded-xl" onClick={resetAndClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
