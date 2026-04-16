import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";

function formatDataLog(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${min}`;
}

function safe(value: any, fallback = "---"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

interface LogParams {
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  beforeData?: any;
  afterData?: any;
}

export async function registrarLog(params: LogParams) {
  await supabase.from("audit_logs").insert({
    user_id: params.userId,
    user_email: params.userEmail,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId ?? null,
    before_data: params.beforeData ?? null,
    after_data: {
      ...params.afterData,
      descricao: params.description,
    },
  });
}

// ---- Helpers para gerar descrições ----

export function logCriarOperacao(dados: {
  responsavel: string;
  nomeCliente: string;
  valorBruto: number;
}) {
  const data = formatDataLog();
  return `Operação criada por ${safe(dados.responsavel)} para ${safe(dados.nomeCliente)} no valor de ${formatCurrency(dados.valorBruto)} em ${data}`;
}

export function logAlterarStatusOperacao(dados: {
  responsavel: string;
  nomeCliente: string;
  statusAnterior: string;
  statusNovo: string;
}) {
  const labels: Record<string, string> = { pendente: "Pendente", concluido: "Concluído", cancelado: "Cancelado" };
  return `Status da operação de ${safe(dados.nomeCliente)} alterado de '${labels[dados.statusAnterior] || dados.statusAnterior}' para '${labels[dados.statusNovo] || dados.statusNovo}' por ${safe(dados.responsavel)}`;
}

export function logExcluirOperacao(dados: {
  responsavel: string;
  nomeCliente: string;
  valorBruto: number;
}) {
  return `Operação de ${safe(dados.nomeCliente)} (${formatCurrency(dados.valorBruto)}) excluída por ${safe(dados.responsavel)}`;
}

export function logCriarCliente(dados: {
  responsavel: string;
  nomeCliente: string;
  tipo: string;
}) {
  const data = formatDataLog();
  return `Cliente ${safe(dados.nomeCliente)} (${safe(dados.tipo)}) criado por ${safe(dados.responsavel)} em ${data}`;
}

export function logEditarCliente(dados: {
  responsavel: string;
  nomeCliente: string;
  campos: string[];
}) {
  return `Cliente ${safe(dados.nomeCliente)} editado por ${safe(dados.responsavel)} — campos: ${dados.campos.join(", ") || "---"}`;
}

export function logExcluirCliente(dados: {
  responsavel: string;
  nomeCliente: string;
}) {
  return `Cliente ${safe(dados.nomeCliente)} excluído por ${safe(dados.responsavel)}`;
}

export function logAlterarConfig(dados: {
  responsavel: string;
  campos: string[];
}) {
  return `Configurações alteradas por ${safe(dados.responsavel)} — campos: ${dados.campos.join(", ") || "---"}`;
}

export function logAlterarStatusUsuario(dados: {
  responsavel: string;
  nomeUsuario: string;
  statusAnterior: string;
  statusNovo: string;
}) {
  const labels: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado" };
  return `Status do usuário ${safe(dados.nomeUsuario)} alterado de '${labels[dados.statusAnterior] || dados.statusAnterior}' para '${labels[dados.statusNovo] || dados.statusNovo}' por ${safe(dados.responsavel)}`;
}

export function logAlterarRoleUsuario(dados: {
  responsavel: string;
  nomeUsuario: string;
  roleAnterior: string;
  roleNova: string;
}) {
  const labels: Record<string, string> = { desenvolvedor: "Desenvolvedor", gestao: "Gestão" };
  return `Role do usuário ${safe(dados.nomeUsuario)} alterada de '${labels[dados.roleAnterior] || dados.roleAnterior}' para '${labels[dados.roleNova] || dados.roleNova}' por ${safe(dados.responsavel)}`;
}

export function logCriarUsuario(dados: {
  responsavel: string;
  nomeUsuario: string;
  email: string;
}) {
  const data = formatDataLog();
  return `Usuário ${safe(dados.nomeUsuario)} (${safe(dados.email)}) criado por ${safe(dados.responsavel)} em ${data}`;
}
