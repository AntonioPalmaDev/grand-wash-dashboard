import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, User, Building2, Check, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomePersonagem, setNomePersonagem] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    if (!isLogin) {
      fetchCompanies();
    }
  }, [isLogin]);

  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const { data } = await supabase.from("companies").select("id, name").eq("active", true).order("name");
      if (data) setAvailableCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId) 
        : [...prev, companyId]
    );
  };

  useEffect(() => {
    if (user && inviteToken) {
      handleAcceptedInvite(inviteToken);
    }
  }, [user, inviteToken]);

  const handleAcceptedInvite = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("accept_invitation", {
        invite_token: token
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: "Convite aceito!",
          description: "Você foi adicionado à empresa com sucesso.",
        });
        window.location.href = "/";
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!nomePersonagem.trim()) {
        setError("Nome do Personagem é obrigatório.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, nomePersonagem, selectedCompanies);
      if (error) setError(error);
      else setSuccess("Conta criada! Aguarde a aprovação de um desenvolvedor para acessar o sistema.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card rounded-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">
            <img src="/zerofoco3.png" alt="Zero Foco" className="h-25 w-25 inline-block mr-2 rounded-full" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Acesse o painel de controle" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label>Nome do Personagem *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={nomePersonagem}
                  onChange={e => setNomePersonagem(e.target.value)}
                  placeholder="Ex: Antonio Palma"
                  className="pl-10"
                  required
                  minLength={2}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Identificação única usada em logs e ações.</p>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Selecione suas Empresas *
              </Label>
              <div className="border border-border/50 rounded-lg bg-background/50 overflow-hidden">
                {companiesLoading ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[150px]">
                    <div className="p-2 space-y-1">
                      {availableCompanies.length === 0 ? (
                        <p className="text-xs text-center text-muted-foreground p-4">Nenhuma empresa disponível.</p>
                      ) : (
                        availableCompanies.map((company) => (
                          <div 
                            key={company.id} 
                            className={`flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-white/5 ${selectedCompanies.includes(company.id) ? 'bg-primary/10 border-primary/20 border' : 'border border-transparent'}`}
                            onClick={() => toggleCompanySelection(company.id)}
                          >
                            <Checkbox 
                              checked={selectedCompanies.includes(company.id)}
                              onCheckedChange={() => toggleCompanySelection(company.id)}
                            />
                            <span className="text-xs font-medium text-slate-200 flex-1">{company.name}</span>
                            {selectedCompanies.includes(company.id) && <Check className="h-3 w-3 text-primary" />}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
              {selectedCompanies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedCompanies.map(id => {
                    const c = availableCompanies.find(x => x.id === id);
                    return c ? (
                      <Badge key={id} variant="secondary" className="text-[10px] py-0 h-4 bg-primary/10 text-primary border-none">
                        {c.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground italic">* Você pode selecionar múltiplas empresas.</p>
          <div>
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div>
            <Label>Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}
          {success && <p className="text-sm text-success bg-success/10 rounded p-2">{success}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} className="text-primary hover:underline font-medium">
            {isLogin ? "Cadastre-se" : "Fazer login"}
          </button>
        </p>
      </div>
    </div>
  );
}
