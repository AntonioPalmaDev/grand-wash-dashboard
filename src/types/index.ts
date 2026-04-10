export type ClientType = "PF" | "PJ";
export type OperationStatus = "pendente" | "concluido" | "cancelado";

export interface Client {
  id: string;
  nome: string;
  tipo: ClientType;
  taxa: number; // taxa personalizada ou 0 para usar o padrão do sistema
  cor?: string; // ✅ Adicionado para suportar a identificação visual por cores
  createdAt: string;
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
  tipo?: string; // campo opcional para compatibilidade de filtros
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