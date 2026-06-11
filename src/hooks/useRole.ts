import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type AppRole = "admin_master" | "desenvolvedor" | "gestao" | "visualizador";

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
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user!.id)
          .single();

        if (error) throw error;
        setRole((data?.role as AppRole) ?? "visualizador");
      } catch (err) {
        console.error("Erro ao buscar role:", err);
        setRole("visualizador");
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin_master";
  const isDev = role === "desenvolvedor" || isAdmin;
  const isGestao = role === "gestao" || isDev;
  const isVisualizador = role === "visualizador" || isGestao;

  const canEdit = isGestao && role !== "visualizador";
  const canManageUsers = isGestao && role !== "visualizador";
  const canAccessAdmin = isAdmin || role === "desenvolvedor";

  return {
    role,
    isAdmin,
    isDev,
    isGestao,
    isVisualizador,
    canEdit,
    canManageUsers,
    canAccessAdmin,
    loading,
  };
}
