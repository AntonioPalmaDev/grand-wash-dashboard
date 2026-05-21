import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Building2, UserPlus, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const InvitePage = () => {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          company:companies(name, logo, primary_color)
        `)
        .eq("token", token)
        .single();

      if (error) {
        console.error("Error fetching invitation:", error);
        setError("Este convite é inválido ou já expirou.");
        return;
      }

      setInvitation(data);
    } catch (err) {
      setError("Ocorreu um erro ao carregar o convite.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to auth with return path
      navigate(`/auth?invite=${token}`);
      return;
    }

    setAccepting(true);
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
        // The App wrapper will handle redirecting to the active company 
        // because we updated the profile company_id in the RPC
        window.location.href = "/";
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao aceitar convite",
          description: result.message,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message,
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Validando Convite...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Convite Inválido</h1>
          <p className="text-slate-400">{error || "Não conseguimos encontrar este convite."}</p>
          <Button variant="outline" className="w-full border-white/10 text-white rounded-xl h-12" onClick={() => navigate("/")}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="max-w-md w-full z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
            <UserPlus className="w-3 h-3" /> Convite para Membro
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Você foi convidado!</h1>
          <p className="text-slate-400">Junte-se a uma nova empresa no ecossistema.</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl border-2">
          <CardHeader className="p-8 text-center border-b border-white/5 bg-white/[0.02]">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-2xl group">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black text-white">{invitation.company?.name}</CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Cargo: <span className="text-primary uppercase font-bold text-xs tracking-widest">{invitation.role}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span>Acesso total às ferramentas da empresa</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span>Colaboração em tempo real com o time</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span>Ambiente seguro e isolado</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg rounded-2xl shadow-lg shadow-primary/20 gap-3 group/btn transition-all active:scale-95"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {user ? "Aceitar e Entrar" : "Entrar na Empresa"}
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {!user && (
              <p className="text-center text-xs text-slate-500 font-medium px-4">
                Ao clicar em entrar, você será redirecionado para criar sua conta ou fazer login.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          © 2026 SAAS HUB ENTERPRISE • SEGURANÇA RLS ATIVA
        </p>
      </div>
    </div>
  );
};

export default InvitePage;
