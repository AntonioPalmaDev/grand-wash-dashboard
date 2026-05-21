export type ClientType = "PF" | "PJ";
export type OperationStatus = "pendente" | "concluido" | "cancelado";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  active: boolean;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface Client {
  id: string;
  nome: string;
  tipo: ClientType;
  taxa: number;
  cor?: string;
  createdAt: string;
  companyId?: string;
}

export interface Operation {
  id: string;
  clientId: string;
  valorBruto: number;
  taxaPercentual: number;
  lucroBruto: number;
  custoMaquina: number;
  lucroLiquido: number;
  valorCliente: number;
  status: OperationStatus;
  responsavel: string;
  data: string;
  createdAt: string;
  pix?: string | null;
  tipo?: string;
  companyId?: string;
}

export interface AppConfig {
  taxaPF: number;
  taxaPJ: number;
  taxaMaquina: number;
  taxaLiquida: number;
  companyId?: string;
}

export interface DashboardStats {
  totalMovimentado: number;
  lucroBrutoTotal: number;
  totalMaquina: number;
  lucroLiquidoTotal: number;
  totalRepassado: number;
  totalOperacoes: number;
}
