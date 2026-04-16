import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  registrarLog,
  logCriarOperacao,
  logAlterarStatusOperacao,
  logExcluirOperacao,
  logCriarCliente,
  logEditarCliente,
  logExcluirCliente,
  logAlterarConfig,
} from "@/lib/logging";
import type { Client, Operation, AppConfig, DashboardStats, OperationStatus } from "@/types";

const DEFAULT_CONFIG: AppConfig = { taxaPF: 30, taxaPJ: 25, taxaMaquina: 10, taxaLiquida: 15 };

interface AppContextType {
  clients: Client[];
  operations: Operation[];
  config: AppConfig;
  loading: boolean;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Promise<void>;
  updateClient: (id: string, c: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addOperation: (o: { clientId: string; valorBruto: number; responsavel?: string }) => Promise<void>;
  updateOperationStatus: (id: string, status: OperationStatus) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  updateConfig: (c: AppConfig) => Promise<void>;
  getStats: () => DashboardStats;
  getClientStats: (id: string) => { totalLavado: number; totalOps: number; lucroGerado: number; mediaPorOp: number; ultimaAtividade: string | null };
  getClientRate: (client: Client) => number;
  getUserName: () => string;
}

const AppContext = createContext<AppContextType | null>(null);

function mapClient(r: any): Client {
  return { id: r.id, nome: r.nome, tipo: r.tipo as "PF" | "PJ", taxa: Number(r.taxa), cor: r.cor || "#a855f7", createdAt: r.created_at };
}

function mapOperation(r: any): Operation {
  return {
    id: r.id, clientId: r.client_id, valorBruto: Number(r.valor_bruto),
    taxaPercentual: Number(r.taxa_percentual), lucroBruto: Number(r.lucro_bruto),
    custoMaquina: Number(r.custo_maquina), lucroLiquido: Number(r.lucro_liquido),
    valorCliente: Number(r.valor_cliente), status: r.status as OperationStatus,
    responsavel: r.responsavel, data: r.data, createdAt: r.created_at,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const getUserName = useCallback(() => userName || user?.email || "Sistema", [userName, user]);

  // Fetch user profile name
  useEffect(() => {
    if (!user) { setUserName(""); return; }
    supabase.from("profiles").select("nome").eq("user_id", user.id).single()
      .then(({ data }) => { if (data?.nome) setUserName(data.nome); });
  }, [user]);

  // Carregamento Inicial
  useEffect(() => {
    if (!user) {
      setClients([]); setOperations([]); setConfig(DEFAULT_CONFIG); setLoading(false);
      return;
    }
    async function fetchAll() {
      setLoading(true);
      const [cRes, oRes, cfgRes] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("operations").select("*").order("data", { ascending: false }),
        supabase.from("configs").select("*").limit(1).single(),
      ]);
      if (cRes.data) setClients(cRes.data.map(mapClient));
      if (oRes.data) setOperations(oRes.data.map(mapOperation));
      if (cfgRes.data) {
        const d = cfgRes.data as any;
        setConfig({ taxaPF: Number(d.taxa_pf), taxaPJ: Number(d.taxa_pj), taxaMaquina: Number(d.taxa_maquina), taxaLiquida: d.taxa_liquida !== undefined ? Number(d.taxa_liquida) : 15 });
      }
      setLoading(false);
    }
    fetchAll();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("app-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, (payload) => {
        if (payload.eventType === "INSERT") setClients(prev => [mapClient(payload.new), ...prev]);
        else if (payload.eventType === "UPDATE") setClients(prev => prev.map(c => c.id === (payload.new as any).id ? mapClient(payload.new) : c));
        else if (payload.eventType === "DELETE") setClients(prev => prev.filter(c => c.id !== (payload.old as any).id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "operations" }, (payload) => {
        if (payload.eventType === "INSERT") setOperations(prev => [mapOperation(payload.new), ...prev]);
        else if (payload.eventType === "UPDATE") setOperations(prev => prev.map(o => o.id === (payload.new as any).id ? mapOperation(payload.new) : o));
        else if (payload.eventType === "DELETE") setOperations(prev => prev.filter(o => o.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getClientRate = useCallback((client: Client) => {
    if (client.taxa > 0) return client.taxa;
    return client.tipo === "PF" ? config.taxaPF : config.taxaPJ;
  }, [config]);

  const addClient = useCallback(async (c: Omit<Client, "id" | "createdAt">) => {
    if (!user) return;
    const { data, error } = await supabase.from("clients").insert({
      user_id: user.id, nome: c.nome, tipo: c.tipo, taxa: Number(c.taxa), cor: c.cor || "#a855f7"
    }).select().single();
    if (error) { console.error("Erro ao inserir cliente:", error.message); return; }
    if (data) {
      const desc = logCriarCliente({ responsavel: getUserName(), nomeCliente: c.nome, tipo: c.tipo });
      await registrarLog({ userId: user.id, userEmail: user.email || "", action: "criar", entity: "cliente", entityId: data.id, description: desc, afterData: { nome: c.nome, tipo: c.tipo } });
      supabase.functions.invoke("discord-notify", {
        body: { type: "novo_cliente", nome: c.nome, responsavel: getUserName() },
      }).catch(console.error);
    }
  }, [user, getUserName]);

  const updateClient = useCallback(async (id: string, c: Partial<Client>) => {
    if (!user) return;
    const old = clients.find(cl => cl.id === id);
    const updatePayload: any = {};
    const campos: string[] = [];
    if (c.nome !== undefined) { updatePayload.nome = c.nome; campos.push("nome"); }
    if (c.tipo !== undefined) { updatePayload.tipo = c.tipo; campos.push("tipo"); }
    if (c.taxa !== undefined) { updatePayload.taxa = Number(c.taxa); campos.push("taxa"); }
    if (c.cor !== undefined) { updatePayload.cor = c.cor; campos.push("cor"); }
    const { error } = await supabase.from("clients").update(updatePayload).eq("id", id);
    if (error) { console.error("Erro ao atualizar cliente:", error.message); return; }
    const desc = logEditarCliente({ responsavel: getUserName(), nomeCliente: old?.nome || c.nome || "---", campos });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "editar", entity: "cliente", entityId: id, description: desc, beforeData: old, afterData: updatePayload });
  }, [user, clients, getUserName]);

  const deleteClient = useCallback(async (id: string) => {
    if (!user) return;
    const old = clients.find(cl => cl.id === id);
    await supabase.from("operations").delete().eq("client_id", id);
    await supabase.from("clients").delete().eq("id", id);
    const desc = logExcluirCliente({ responsavel: getUserName(), nomeCliente: old?.nome || "---" });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "excluir", entity: "cliente", entityId: id, description: desc, beforeData: old });
  }, [user, clients, getUserName]);

  const addOperation = useCallback(async (o: { clientId: string; valorBruto: number; responsavel?: string }) => {
    if (!user) return;
    const client = clients.find(c => c.id === o.clientId);
    if (!client) return;
    const taxa = getClientRate(client);
    const lucroBruto = o.valorBruto * (taxa / 100);
    const custoMaquina = o.valorBruto * (config.taxaMaquina / 100);
    const lucroLiquido = lucroBruto - custoMaquina;
    const valorCliente = o.valorBruto - lucroBruto;
    const responsavel = o.responsavel || getUserName();

    const { data } = await supabase.from("operations").insert({
      user_id: user.id, client_id: o.clientId, valor_bruto: o.valorBruto,
      taxa_percentual: taxa, lucro_bruto: lucroBruto, custo_maquina: custoMaquina,
      lucro_liquido: lucroLiquido, valor_cliente: valorCliente, responsavel,
    }).select().single();

    if (data) {
      const desc = logCriarOperacao({ responsavel, nomeCliente: client.nome, valorBruto: o.valorBruto });
      await registrarLog({ userId: user.id, userEmail: user.email || "", action: "criar", entity: "operação", entityId: data.id, description: desc, afterData: { valorBruto: o.valorBruto, cliente: client.nome } });
      supabase.functions.invoke("discord-notify", {
        body: { type: "nova_operacao", nome: client.nome, responsavel, status: "pendente" },
      }).catch(console.error);
    }
  }, [user, clients, config, getClientRate, getUserName]);

  const updateOperationStatus = useCallback(async (id: string, status: OperationStatus) => {
    if (!user) return;
    const op = operations.find(o => o.id === id);
    const client = op ? clients.find(c => c.id === op.clientId) : null;
    await supabase.from("operations").update({ status }).eq("id", id);
    const desc = logAlterarStatusOperacao({ responsavel: getUserName(), nomeCliente: client?.nome || "---", statusAnterior: op?.status || "---", statusNovo: status });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "status", entity: "operação", entityId: id, description: desc, beforeData: { status: op?.status }, afterData: { status } });
  }, [user, operations, clients, getUserName]);

  const deleteOperation = useCallback(async (id: string) => {
    if (!user) return;
    const op = operations.find(o => o.id === id);
    const client = op ? clients.find(c => c.id === op.clientId) : null;
    await supabase.from("operations").delete().eq("id", id);
    const desc = logExcluirOperacao({ responsavel: getUserName(), nomeCliente: client?.nome || "---", valorBruto: op?.valorBruto || 0 });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "excluir", entity: "operação", entityId: id, description: desc, beforeData: op });
  }, [user, operations, clients, getUserName]);

  const updateConfig = useCallback(async (c: AppConfig) => {
    if (!user) return;
    const payload: any = { user_id: user.id, taxa_pf: c.taxaPF, taxa_pj: c.taxaPJ, taxa_maquina: c.taxaMaquina, taxa_liquida: c.taxaLiquida };
    const { error } = await supabase.from("configs").upsert(payload);
    if (error) { console.error("Erro ao salvar config:", error.message); return; }
    const campos: string[] = [];
    if (c.taxaPF !== config.taxaPF) campos.push("Taxa PF");
    if (c.taxaPJ !== config.taxaPJ) campos.push("Taxa PJ");
    if (c.taxaMaquina !== config.taxaMaquina) campos.push("Taxa Máquina");
    if (c.taxaLiquida !== config.taxaLiquida) campos.push("Taxa Líquida");
    const desc = logAlterarConfig({ responsavel: getUserName(), campos });
    await registrarLog({ userId: user.id, userEmail: user.email || "", action: "config", entity: "configuração", description: desc, afterData: c });
    setConfig(c);
  }, [user, config, getUserName]);

  const getStats = useCallback((): DashboardStats => {
    const completed = operations.filter(op => op.status === "concluido");
    return {
      totalMovimentado: completed.reduce((s, op) => s + op.valorBruto, 0),
      lucroBrutoTotal: completed.reduce((s, op) => s + op.lucroBruto, 0),
      totalMaquina: completed.reduce((s, op) => s + op.custoMaquina, 0),
      lucroLiquidoTotal: completed.reduce((s, op) => s + op.lucroLiquido, 0),
      totalRepassado: completed.reduce((s, op) => s + op.valorCliente, 0),
      totalOperacoes: completed.length,
    };
  }, [operations]);

  const getClientStats = useCallback((id: string) => {
    const ops = operations.filter(op => op.clientId === id && op.status === "concluido");
    const totalLavado = ops.reduce((s, op) => s + op.valorBruto, 0);
    const totalOps = ops.length;
    const lucroGerado = ops.reduce((s, op) => s + op.lucroLiquido, 0);
    const sorted = [...ops].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return { totalLavado, totalOps, lucroGerado, mediaPorOp: totalOps > 0 ? totalLavado / totalOps : 0, ultimaAtividade: sorted[0]?.data ?? null };
  }, [operations]);

  return (
    <AppContext.Provider value={{ clients, operations, config, loading, addClient, updateClient, deleteClient, addOperation, updateOperationStatus, deleteOperation, updateConfig, getStats, getClientStats, getClientRate, getUserName }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
