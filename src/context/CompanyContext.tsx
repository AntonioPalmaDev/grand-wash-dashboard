
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";

interface CompanyContextType {
  activeCompany: Company | null;
  availableCompanies: Company[];
  loading: boolean;
  isGlobalMode: boolean;
  switchCompany: (companyId: string | null) => void;
  createCompany: (name: string, primaryColor?: string) => Promise<{ data: any; error: any }>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

function mapCompany(r: any): Company {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logo: r.logo,
    primaryColor: r.primary_color || "#0EA5E9",
    secondaryColor: r.secondary_color || "#6366F1",
    active: r.active,
    createdAt: r.created_at,
  };
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isGlobalMode = location.pathname.startsWith("/admin");

  const refreshCompanies = useCallback(async () => {
    if (!user) {
      setAvailableCompanies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("active", true);

    if (data) {
      const mapped = data.map(mapCompany);
      setAvailableCompanies(mapped);
      
      const savedId = localStorage.getItem("active_company_id");
      const found = mapped.find(c => c.id === savedId) || null;
      
      if (!isGlobalMode && found) {
        setActiveCompany(found);
        document.documentElement.style.setProperty('--primary', hexToHSL(found.primaryColor));
      } else {
        setActiveCompany(null);
      }
    }
    setLoading(false);
  }, [user, isGlobalMode]);

  const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  useEffect(() => {
    refreshCompanies();
  }, [refreshCompanies]);

  const switchCompany = useCallback((companyId: string | null) => {
    if (!companyId) {
      setActiveCompany(null);
      localStorage.removeItem("active_company_id");
      window.location.href = "/admin";
      return;
    }

    const company = availableCompanies.find(c => c.id === companyId);
    if (company) {
      setActiveCompany(company);
      localStorage.setItem("active_company_id", companyId);
      window.location.href = "/";
    }
  }, [availableCompanies]);

  const createCompany = async (name: string, primaryColor: string = "#0EA5E9") => {
    if (!user) return { data: null, error: "Usuário não autenticado" };
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ name, slug, primary_color: primaryColor })
      .select()
      .single();
    if (companyError) return { data: null, error: companyError };
    await supabase.from("user_companies").insert({ user_id: user.id, company_id: company.id });
    await refreshCompanies();
    return { data: company, error: null };
  };

  return (
    <CompanyContext.Provider value={{ activeCompany, availableCompanies, loading, isGlobalMode, switchCompany, createCompany, refreshCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}

