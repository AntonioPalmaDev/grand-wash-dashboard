import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, User, Building2, Check, Loader2, Key } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const handleAnonLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Validar token no banco
      const { data, error: tokenError } = await supabase
        .from("anonymous_tokens")
        .select("*")
        .eq("token", tokenInput.toUpperCase())
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (tokenError) throw tokenError;

      if (!data) {
        setError("Token inválido ou expirado.");
        setLoading(false);
        return;
      }

      // Se token válido, logar com a conta anônima
      const anonEmail = "anonimo@anonimo.com";
      const anonPass = "anonimo";
      
      const { error: signInError } = await signIn(anonEmail, anonPass);
      
      if (signInError) {
        if (signInError.includes("Invalid login credentials")) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: anonEmail,
            password: anonPass,
            options: {
              data: {
                nome_personagem: "Anonimo",
                nome: "Anonimo",
                role: "visualizador"
              }
            }
          });
          if (signUpError) {
            setError(signUpError.message);
          } else {
            const { error: retryError } = await signIn(anonEmail, anonPass);
            if (retryError) setError(retryError);
          }
        } else {
          setError(signInError);
        }
      } else {
        setTokenDialogOpen(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            </div>
          )}

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

          <div className="space-y-3 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
            
            {isLogin && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-white/10 hover:bg-white/5 gap-2" 
                onClick={() => setTokenDialogOpen(true)}
                disabled={loading}
              >
                <User className="h-4 w-4" /> Entrar como Anônimo
              </Button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} className="text-primary hover:underline font-medium">
            {isLogin ? "Cadastre-se" : "Fazer login"}
          </button>
        </p>
      </div>

      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Token de Acesso
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Insira o token de 24 horas fornecido por um administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <Input 
                placeholder="EX: A1B2C3D4" 
                value={tokenInput} 
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                className="bg-white/5 border-white/10 text-center text-xl font-mono tracking-widest uppercase h-14 focus-visible:ring-primary"
              />
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded text-center">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTokenDialogOpen(false)} className="text-slate-400">Cancelar</Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-bold" 
              onClick={handleAnonLogin}
              disabled={loading || !tokenInput}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar e Entrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
