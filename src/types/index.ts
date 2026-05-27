export type ClientType = "PF" | "PJ";
export type OperationStatus = "pendente" | "concluido" | "cancelado";
export type ProductCategory = "itens" | "dinheiro";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
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

export interface Product {
  id: string;
  companyId: string;
  name: string;
  category: ProductCategory;
  type?: string;
  baseValue: number;
  percentage: number;
  stockQuantity: number;
  description?: string;
  status: "ativo" | "inativo";
  createdAt: string;
  updatedAt: string;
}

export interface OperationItem {
  id: string;
  operationId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
  product?: Product;
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
  operationType?: string;
  companyId?: string;
  category: ProductCategory;
  items?: OperationItem[];
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
  totalItensVendidos?: number;
}
