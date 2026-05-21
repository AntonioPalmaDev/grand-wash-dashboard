import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Building2, Save, X, Tag as TagIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditCompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditCompanyModal = ({ company, isOpen, onClose, onSuccess }: EditCompanyModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#0EA5E9");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setName(company.name);
      setDescription(company.description || "");
      setActive(company.active);
      setPrimaryColor(company.primaryColor || "#0EA5E9");
      setTags(company.tags || []);
    }
  }, [company]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name,
          description,
          active,
          primary_color: primaryColor,
          tags
        })
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Informações da empresa atualizadas.",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 text-slate-200 sm:rounded-3xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Editar Informações
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-400 font-medium">Nome da Empresa</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary"
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 h-12">
                <Label className="text-slate-400 font-medium">Status da Empresa</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase ${active ? 'text-green-500' : 'text-red-500'}`}>
                    {active ? 'Ativa' : 'Inativa'}
                  </span>
                  <Switch checked={active} onCheckedChange={setActive} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-400 font-medium">Descrição / Sobre</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente a empresa e seu propósito..."
              className="bg-white/5 border-white/10 text-white min-h-[100px] rounded-xl focus:ring-primary resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-slate-400 font-medium">Tags do Ecossistema</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-primary/20 text-primary border-primary/30 py-1 px-3 gap-1 rounded-lg">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Pressione Enter para adicionar tags..."
                className="bg-white/5 border-white/10 text-white pl-10 h-11 rounded-xl focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 h-12 text-slate-400 hover:bg-white/5 hover:text-white">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20 gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
