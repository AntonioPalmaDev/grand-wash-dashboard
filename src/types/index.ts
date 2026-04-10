export type ClientType = "PF" | "PJ";
export type OperationStatus = "pendente" | "concluido" | "cancelado";

export interface Client {
  id: string;
  nome: string;
  tipo: ClientType;
  taxa: number; // custom rate or default
  createdAt: string;
}

export interface Operation {
  tipo: string;
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
}

export interface AppConfig {
  taxaPF: number;
  taxaPJ: number;
  taxaMaquina: number;
}

export interface DashboardStats {
  totalMovimentado: number;
  lucroBrutoTotal: number;
  totalMaquina: number;
  lucroLiquidoTotal: number;
  totalRepassado: number;
  totalOperacoes: number;
}
