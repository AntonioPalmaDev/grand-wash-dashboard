import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Client, Operation, AppConfig, DashboardStats, OperationStatus } from "@/types";

const DEFAULT_CONFIG: AppConfig = { taxaPF: 30, taxaPJ: 25, taxaMaquina: 10 };

interface AppContextType {
  clients: Client[];
  operations: Operation[];
  config: AppConfig;
  loading: boolean;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Promise<void>;
  updateClient: (id: string, c: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addOperation: (o: { clientId: string; valorBruto: number; responsavel: string }) => Promise<void>;
  updateOperationStatus: (id: string, status: OperationStatus) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  updateConfig: (c: AppConfig) => Promise<void>;
  getStats: () => DashboardStats;
  getClientStats: (id: string) => { totalLavado: number; totalOps: number; lucroGerado: number; mediaPorOp: number; ultimaAtividade: string | null };
  getClientRate: (client: Client) => number;
}

const AppContext = createContext<AppContextType | null>(null);

async function logAction(userId: string, userEmail: string, action: string, entity: string, entityId?: string, beforeData?: any, afterData?: any) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    user_email: userEmail,
    action,
    entity,
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });
}

function mapClient(r: any): Client {
  return { 
    id: r.id, 
    nome: r.nome, 
    tipo: r.tipo as "PF" | "PJ", 
    taxa: Number(r.taxa), 
    cor: r.cor || "#a855f7", 
    createdAt: r.created_at 
  };
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

  useEffect(() => {
    if (!user) {
      setClients([]);
      setOperations([]);
      setConfig(DEFAULT_CONFIG);
      setLoading(false);
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
        setConfig({ taxaPF: Number(cfgRes.data.taxa_pf), taxaPJ: Number(cfgRes.data.taxa_pj), taxaMaquina: Number(cfgRes.data.taxa_maquina) });
      }
      setLoading(false);
    }
    fetchAll();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("app-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setClients(prev => {
            if (prev.some(c => c.id === (payload.new as any).id)) return prev;
            return [mapClient(payload.new), ...prev];
          });
        } else if (payload.eventType === "UPDATE") {
          setClients(prev => prev.map(c => c.id === (payload.new as any).id ? mapClient(payload.new) : c));
        } else if (payload.eventType === "DELETE") {
          setClients(prev => prev.filter(c => c.id !== (payload.old as any).id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "operations" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOperations(prev => {
            if (prev.some(o => o.id === (payload.new as any).id)) return prev;
            return [mapOperation(payload.new), ...prev];
          });
        } else if (payload.eventType === "UPDATE") {
          setOperations(prev => prev.map(o => o.id === (payload.new as any).id ? mapOperation(payload.new) : o));
        } else if (payload.eventType === "DELETE") {
          setOperations(prev => prev.filter(o => o.id !== (payload.old as any).id));
        }
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

  // Criamos o objeto garantindo que os tipos batem com o banco
  const payload: any = {
    user_id: user.id,
    nome: c.nome,
    tipo: c.tipo,
    taxa: Number(c.taxa),
    cor: c.cor || "#a855f7"
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(payload) // O uso do 'any' acima remove o erro de tipagem imediato
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao inserir no Supabase:", error.message);
    return;
  }

  if (data) {
    // Registra a ação no log de auditoria
    await logAction(user.id, user.email || "", "criar", "cliente", data.id, null, { 
      nome: c.nome, 
      tipo: c.tipo 
    });
  }
}, [user]);

 const updateClient = useCallback(async (id: string, c: Partial<Client>) => {
  if (!user) return;
  
  const old = clients.find(cl => cl.id === id);
  
  // Montamos o objeto de update garantindo a tipagem correta para o banco
  const updatePayload: any = {};
  
  if (c.nome !== undefined) updatePayload.nome = c.nome;
  if (c.tipo !== undefined) updatePayload.tipo = c.tipo; // "PF" ou "PJ"
  if (c.taxa !== undefined) updatePayload.taxa = Number(c.taxa); // Garante que é número
  if (c.cor !== undefined) updatePayload.cor = c.cor;

  const { error } = await supabase
    .from("clients")
    .update(updatePayload)
    .eq("id", id);
    
  if (error) {
    console.error("Erro ao atualizar no Supabase:", error.message);
   
    return;
  }

  // Log de auditoria para rastrear o que mudou
  await logAction(user.id, user.email || "", "editar", "cliente", id, old, updatePayload);
}, [user, clients]);

  const deleteClient = useCallback(async (id: string) => {
    if (!user) return;
    const old = clients.find(cl => cl.id === id);
    await supabase.from("operations").delete().eq("client_id", id);
    await supabase.from("clients").delete().eq("id", id);
    await logAction(user.id, user.email || "", "excluir", "cliente", id, old, null);
  }, [user, clients]);

  const addOperation = useCallback(async (o: { clientId: string; valorBruto: number; responsavel: string }) => {
    if (!user) return;
    const client = clients.find(c => c.id === o.clientId);
    if (!client) return;
    const taxa = getClientRate(client);
    const lucroBruto = o.valorBruto * (taxa / 100);
    const custoMaquina = o.valorBruto * (config.taxaMaquina / 100);
    const lucroLiquido = lucroBruto - custoMaquina;
    const valorCliente = o.valorBruto - lucroBruto;

    const { data, error } = await supabase.from("operations").insert({
      user_id: user.id,
      client_id: o.clientId,
      valor_bruto: o.valorBruto,
      taxa_percentual: taxa,
      lucro_bruto: lucroBruto,
      custo_maquina: custoMaquina,
      lucro_liquido: lucroLiquido,
      valor_cliente: valorCliente,
      responsavel: o.responsavel || "Sistema",
    }).select().single();

    if (data && !error) {
      await logAction(user.id, user.email || "", "criar", "operação", data.id, null, { clientId: o.clientId, valorBruto: o.valorBruto });
    }
  }, [user, clients, config, getClientRate]);

  const updateOperationStatus = useCallback(async (id: string, status: OperationStatus) => {
    if (!user) return;
    const old = operations.find(op => op.id === id);
    await supabase.from("operations").update({ status }).eq("id", id);
    await logAction(user.id, user.email || "", "status", "operação", id, { status: old?.status }, { status });
  }, [user, operations]);

  const deleteOperation = useCallback(async (id: string) => {
    if (!user) return;
    const old = operations.find(op => op.id === id);
    await supabase.from("operations").delete().eq("id", id);
    await logAction(user.id, user.email || "", "excluir", "operação", id, old, null);
  }, [user, operations]);

  const updateConfig = useCallback(async (c: AppConfig) => {
    if (!user) return;
    await supabase.from("configs").upsert({ user_id: user.id, taxa_pf: c.taxaPF, taxa_pj: c.taxaPJ, taxa_maquina: c.taxaMaquina });
    await logAction(user.id, user.email || "", "config", "configurações", null, config, c);
  }, [user, config]);

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
    return {
      totalLavado, totalOps, lucroGerado,
      mediaPorOp: totalOps > 0 ? totalLavado / totalOps : 0,
      ultimaAtividade: sorted[0]?.data ?? null,
    };
  }, [operations]);

  return (
    <AppContext.Provider 
      value={{ 
        clients, 
        operations, 
        config, 
        loading, 
        addClient, 
        updateClient, 
        deleteClient, 
        addOperation, 
        updateOperationStatus, 
        deleteOperation, 
        updateConfig, 
        getStats, 
        getClientStats,
        getClientRate 
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}