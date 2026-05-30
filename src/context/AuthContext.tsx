import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserStatus = "pendente" | "aprovado" | "rejeitado" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userStatus: UserStatus;
  nomePersonagem: string | null;
  isMasterAdmin: boolean;
  companyId: string | null;
  signUp: (email: string, password: string, nomePersonagem: string, companyIds?: string[]) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshPersonagem: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>(null);
  const [nomePersonagem, setNomePersonagem] = useState<string | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("status, nome_personagem, is_master_admin, company_id")
      .eq("user_id", userId)
      .single();
    setUserStatus((data?.status as UserStatus) ?? "pendente");
    setNomePersonagem((data?.nome_personagem as string | null) ?? null);
    setIsMasterAdmin(data?.is_master_admin ?? false);
    setCompanyId(data?.company_id ?? null);
  }

  const refreshStatus = async () => {
    if (user) await fetchProfile(user.id);
  };
  const refreshPersonagem = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setUserStatus(null);
        setNomePersonagem(null);
        setIsMasterAdmin(false);
        setCompanyId(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, nomePersonagem: string, companyIds?: string[]) => {
    // Verificar duplicidade do nome do personagem antes do signup
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("nome_personagem", nomePersonagem.trim())
      .maybeSingle();
    if (existing) return { error: "Este Nome do Personagem já está em uso." };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          nome_personagem: nomePersonagem.trim(), 
          nome: nomePersonagem.trim() 
        } 
      },
    });

    if (!error && data.user) {
      // Se informou empresas no cadastro, vinculamos via user_companies
      if (companyIds && companyIds.length > 0) {
        const links = companyIds.map(cid => ({
          user_id: data.user!.id,
          company_id: cid
        }));
        await supabase.from("user_companies").insert(links);
        
        // Também define a primeira como empresa principal no profile
        await supabase
          .from("profiles")
          .update({ company_id: companyIds[0] })
          .eq("user_id", data.user.id);
      }

      supabase.functions.invoke("discord-notify", {
        body: { type: "novo_usuario", nome: nomePersonagem.trim(), email },
      }).catch(console.error);
    }
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userStatus, nomePersonagem, isMasterAdmin, companyId, signUp, signIn, signOut, refreshStatus, refreshPersonagem }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
