import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type AppRole = "desenvolvedor" | "gestao";

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    async function fetchRole() {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user!.id)
        .single();
      
      setRole((data?.role as AppRole) ?? "gestao");
      setLoading(false);
    }

    fetchRole();
  }, [user]);

  const isDev = role === "desenvolvedor";
  const isGestao = role === "gestao";

  return { role, isDev, isGestao, loading };
}
