import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Client, Operation, AppConfig, DashboardStats, OperationStatus } from "@/types";

function generateId() {
  return crypto.randomUUID();
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_CONFIG: AppConfig = { taxaPF: 30, taxaPJ: 25, taxaMaquina: 10 };

interface AppContextType {
  clients: Client[];
  operations: Operation[];
  config: AppConfig;
  addClient: (c: Omit<Client, "id" | "createdAt">) => void;
  updateClient: (id: string, c: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addOperation: (o: { clientId: string; valorBruto: number; responsavel: string }) => void;
  updateOperationStatus: (id: string, status: OperationStatus) => void;
  deleteOperation: (id: string) => void;
  updateConfig: (c: AppConfig) => void;
  getStats: () => DashboardStats;
  getClientStats: (id: string) => { totalLavado: number; totalOps: number; lucroGerado: number; mediaPorOp: number; ultimaAtividade: string | null };
  getClientRate: (client: Client) => number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage("lv_clients", []));
  const [operations, setOperations] = useState<Operation[]>(() => loadFromStorage("lv_operations", []));
  const [config, setConfig] = useState<AppConfig>(() => loadFromStorage("lv_config", DEFAULT_CONFIG));

  useEffect(() => { localStorage.setItem("lv_clients", JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem("lv_operations", JSON.stringify(operations)); }, [operations]);
  useEffect(() => { localStorage.setItem("lv_config", JSON.stringify(config)); }, [config]);

  const getClientRate = useCallback((client: Client) => {
    if (client.taxa > 0) return client.taxa;
    return client.tipo === "PF" ? config.taxaPF : config.taxaPJ;
  }, [config]);

  const addClient = useCallback((c: Omit<Client, "id" | "createdAt">) => {
    setClients(prev => [...prev, { ...c, id: generateId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateClient = useCallback((id: string, c: Partial<Client>) => {
    setClients(prev => prev.map(cl => cl.id === id ? { ...cl, ...c } : cl));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(cl => cl.id !== id));
    setOperations(prev => prev.filter(op => op.clientId !== id));
  }, []);

  const addOperation = useCallback((o: { clientId: string; valorBruto: number; responsavel: string }) => {
    const client = clients.find(c => c.id === o.clientId);
    if (!client) return;
    const taxa = getClientRate(client);
    const lucroBruto = o.valorBruto * (taxa / 100);
    const custoMaquina = o.valorBruto * (config.taxaMaquina / 100);
    const lucroLiquido = lucroBruto - custoMaquina;
    const valorCliente = o.valorBruto - lucroBruto;

    const op: Operation = {
      id: generateId(),
      clientId: o.clientId,
      valorBruto: o.valorBruto,
      taxaPercentual: taxa,
      lucroBruto,
      custoMaquina,
      lucroLiquido,
      valorCliente,
      status: "pendente",
      responsavel: o.responsavel,
      data: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setOperations(prev => [...prev, op]);
  }, [clients, config, getClientRate]);

  const updateOperationStatus = useCallback((id: string, status: OperationStatus) => {
    setOperations(prev => prev.map(op => op.id === id ? { ...op, status } : op));
  }, []);

  const deleteOperation = useCallback((id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  }, []);

  const updateConfig = useCallback((c: AppConfig) => { setConfig(c); }, []);

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
      totalLavado,
      totalOps,
      lucroGerado,
      mediaPorOp: totalOps > 0 ? totalLavado / totalOps : 0,
      ultimaAtividade: sorted[0]?.data ?? null,
    };
  }, [operations]);

  return (
    <AppContext.Provider value={{ clients, operations, config, addClient, updateClient, deleteClient, addOperation, updateOperationStatus, deleteOperation, updateConfig, getStats, getClientStats, getClientRate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
