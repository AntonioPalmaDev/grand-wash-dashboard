import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ZERO_FOCO_COMPANY } from "@/config/company";
import type { User, Session } from "@supabase/supabase-js";

type UserStatus = "pendente" | "aprovado" | "rejeitado" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userStatus: UserStatus;
  nomePersonagem: string | null;
  isMasterAdmin: false;
  companyId: string | null;
  signUp: (
    email: string,
    password: string,
    nomePersonagem: string,
    companyIds?: string[]
  ) => Promise<{ error: string | null }>;
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
      .select("status, nome_personagem")
      .eq("user_id", userId)
      .single();

    setUserStatus((data?.status as UserStatus) ?? "pendente");
    setNomePersonagem((data?.nome_personagem as string | null) ?? null);
    setIsMasterAdmin(false);
    setCompanyId(ZERO_FOCO_COMPANY.id);
  }

  const refreshStatus = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshPersonagem = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const signUp = async (
    email: string,
    password: string,
    nomePersonagem: string,
    _companyIds?: string[]
  ) => {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("nome_personagem", nomePersonagem.trim())
      .maybeSingle();

    if (existing) {
      return { error: "Este Nome do Personagem já está em uso." };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_personagem: nomePersonagem.trim(),
          nome: nomePersonagem.trim(),
          company_id: ZERO_FOCO_COMPANY.id,
        },
      },
    });

    if (!error) {
      supabase.functions
        .invoke("discord-notify", {
          body: {
            type: "novo_usuario",
            nome: nomePersonagem.trim(),
            email,
          },
        })
        .catch(console.error);
    }

    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userStatus,
        nomePersonagem,
        isMasterAdmin,
        companyId,
        signUp,
        signIn,
        signOut,
        refreshStatus,
        refreshPersonagem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be inside AuthProvider");
  }

  return ctx;
}