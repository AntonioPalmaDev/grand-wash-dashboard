import React, { createContext, useContext } from "react";
import { ZERO_FOCO_COMPANY } from "@/config/company";
type Company = typeof ZERO_FOCO_COMPANY;

interface CompanyContextType {
  activeCompany: Company | null;
  availableCompanies: Company[];
  loading: boolean;
  isGlobalMode: boolean;
  switchCompany: (companyId: string | null) => void;
  createCompany: (
    name: string,
    primaryColor?: string
  ) => Promise<{ data: any; error: any }>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const activeCompany = ZERO_FOCO_COMPANY;
  const availableCompanies = [ZERO_FOCO_COMPANY];

  const refreshCompanies = async () => {};

  const switchCompany = (_companyId: string | null) => {
    localStorage.setItem("active_company_id", ZERO_FOCO_COMPANY.id);
  };

  const createCompany = async () => {
    return {
      data: null,
      error: "Criação de empresas desativada. Sistema fixado na Zero Foco.",
    };
  };

  return (
    <CompanyContext.Provider
      value={{
        activeCompany,
        availableCompanies,
        loading: false,
        isGlobalMode: false,
        switchCompany,
        createCompany,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);

  if (!ctx) {
    throw new Error("useCompany must be used within CompanyProvider");
  }

  return ctx;
}
