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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  // Fetch all data when user changes
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

      if (cRes.data) {
        setClients(cRes.data.map(r => ({
          id: r.id, nome: r.nome, tipo: r.tipo as "PF" | "PJ", taxa: Number(r.taxa), createdAt: r.created_at,
        })));
      }
      if (oRes.data) {
        setOperations(oRes.data.map(r => ({
          id: r.id, clientId: r.client_id, valorBruto: Number(r.valor_bruto),
          taxaPercentual: Number(r.taxa_percentual), lucroBruto: Number(r.lucro_bruto),
          custoMaquina: Number(r.custo_maquina), lucroLiquido: Number(r.lucro_liquido),
          valorCliente: Number(r.valor_cliente), status: r.status as OperationStatus,
          responsavel: r.responsavel, data: r.data, createdAt: r.created_at,
        })));
      }
      if (cfgRes.data) {
        setConfig({ taxaPF: Number(cfgRes.data.taxa_pf), taxaPJ: Number(cfgRes.data.taxa_pj), taxaMaquina: Number(cfgRes.data.taxa_maquina) });
      } else {
        // Create default config for new user
        await supabase.from("configs").insert({ user_id: user.id, taxa_pf: 30, taxa_pj: 25, taxa_maquina: 10 });
      }
      setLoading(false);
    }
    fetchAll();
  }, [user]);

  const getClientRate = useCallback((client: Client) => {
    if (client.taxa > 0) return client.taxa;
    return client.tipo === "PF" ? config.taxaPF : config.taxaPJ;
  }, [config]);

  const addClient = useCallback(async (c: Omit<Client, "id" | "createdAt">) => {
    if (!user) return;
    const { data, error } = await supabase.from("clients").insert({ user_id: user.id, nome: c.nome, tipo: c.tipo, taxa: c.taxa }).select().single();
    if (data && !error) {
      setClients(prev => [{ id: data.id, nome: data.nome, tipo: data.tipo as "PF" | "PJ", taxa: Number(data.taxa), createdAt: data.created_at }, ...prev]);
    }
  }, [user]);

  const updateClient = useCallback(async (id: string, c: Partial<Client>) => {
    const update: Record<string, unknown> = {};
    if (c.nome !== undefined) update.nome = c.nome;
    if (c.tipo !== undefined) update.tipo = c.tipo;
    if (c.taxa !== undefined) update.taxa = c.taxa;
    await supabase.from("clients").update(update).eq("id", id);
    setClients(prev => prev.map(cl => cl.id === id ? { ...cl, ...c } : cl));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    await supabase.from("operations").delete().eq("client_id", id);
    await supabase.from("clients").delete().eq("id", id);
    setClients(prev => prev.filter(cl => cl.id !== id));
    setOperations(prev => prev.filter(op => op.clientId !== id));
  }, []);

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
      setOperations(prev => [{
        id: data.id, clientId: data.client_id, valorBruto: Number(data.valor_bruto),
        taxaPercentual: Number(data.taxa_percentual), lucroBruto: Number(data.lucro_bruto),
        custoMaquina: Number(data.custo_maquina), lucroLiquido: Number(data.lucro_liquido),
        valorCliente: Number(data.valor_cliente), status: data.status as OperationStatus,
        responsavel: data.responsavel, data: data.data, createdAt: data.created_at,
      }, ...prev]);
    }
  }, [user, clients, config, getClientRate]);

  const updateOperationStatus = useCallback(async (id: string, status: OperationStatus) => {
    await supabase.from("operations").update({ status }).eq("id", id);
    setOperations(prev => prev.map(op => op.id === id ? { ...op, status } : op));
  }, []);

  const deleteOperation = useCallback(async (id: string) => {
    await supabase.from("operations").delete().eq("id", id);
    setOperations(prev => prev.filter(op => op.id !== id));
  }, []);

  const updateConfig = useCallback(async (c: AppConfig) => {
    if (!user) return;
    await supabase.from("configs").upsert({ user_id: user.id, taxa_pf: c.taxaPF, taxa_pj: c.taxaPJ, taxa_maquina: c.taxaMaquina });
    setConfig(c);
  }, [user]);

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
    <AppContext.Provider value={{ clients, operations, config, loading, addClient, updateClient, deleteClient, addOperation, updateOperationStatus, deleteOperation, updateConfig, getStats, getClientStats, getClientRate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
