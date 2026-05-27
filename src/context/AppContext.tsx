import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
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
import type { Client, Operation, AppConfig, DashboardStats, OperationStatus, Product, OperationItem, ProductCategory } from "@/types";

const DEFAULT_CONFIG: AppConfig = { taxaPF: 30, taxaPJ: 25, taxaMaquina: 10, taxaLiquida: 15 };

interface AppContextType {
  clients: Client[];
  operations: Operation[];
  products: Product[];
  config: AppConfig;
  loading: boolean;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Promise<void>;
  updateClient: (id: string, c: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, "id" | "createdAt" | "updatedAt" | "companyId">) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addOperation: (o: { 
    clientId: string; 
    valorBruto: number; 
    responsavel?: string; 
    pix?: string | null; 
    category?: ProductCategory;
    items?: { productId: string; quantity: number; unitPrice: number; subtotal: number }[]
  }) => Promise<void>;
  updateOperationStatus: (id: string, status: OperationStatus) => Promise<void>;
  updateOperationPix: (id: string, pix: string | null) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  updateConfig: (c: AppConfig) => Promise<void>;
  getStats: (opsOverride?: Operation[]) => DashboardStats;
  getClientStats: (id: string) => { totalLavado: number; totalOps: number; lucroGerado: number; mediaPorOp: number; ultimaAtividade: string | null };
  getClientRate: (client: Client) => number;
  getUserName: () => string;
}

const AppContext = createContext<AppContextType | null>(null);

function mapClient(r: any): Client {
  return { id: r.id, nome: r.nome, tipo: r.tipo as "PF" | "PJ", taxa: Number(r.taxa), cor: r.cor || "#a855f7", createdAt: r.created_at };
}

function mapProduct(r: any): Product {
  return {
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    category: r.category as ProductCategory,
    type: r.type,
    baseValue: Number(r.base_value),
    percentage: Number(r.percentage),
    stockQuantity: Number(r.stock_quantity),
    description: r.description,
    status: r.status as "ativo" | "inativo",
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function mapOperation(r: any): Operation {
  return {
    id: r.id, 
    clientId: r.client_id, 
    valorBruto: Number(r.valor_bruto),
    taxaPercentual: Number(r.taxa_percentual), 
    lucroBruto: Number(r.lucro_bruto),
    custoMaquina: Number(r.custo_maquina), 
    lucroLiquido: Number(r.lucro_liquido),
    valorCliente: Number(r.valor_cliente), 
    status: r.status as OperationStatus,
    responsavel: r.responsavel, 
    data: r.data, 
    createdAt: r.created_at,
    pix: (r as any).pix ?? null,
    category: (r as any).category as ProductCategory || "dinheiro",
    operationType: r.operation_type || null,
    items: (r as any).operation_items ? (r as any).operation_items.map((item: any) => ({
      id: item.id,
      operationId: item.operation_id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
      createdAt: item.created_at,
      product: item.products ? mapProduct(item.products) : undefined
    })) : []
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, nomePersonagem } = useAuth();
  const { activeCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const getUserName = useCallback(
    () => nomePersonagem || user?.email || "Sistema",
    [nomePersonagem, user]
  );

  const logBase = useCallback(
    () => ({
      userId: user?.id ?? "",
      userEmail: user?.email ?? "",
      nomePersonagem: nomePersonagem ?? null,
      companyId: activeCompany?.id ?? null,
    }),
    [user, nomePersonagem, activeCompany]
  );

  // Carregamento Inicial — filtra registros deletados (soft delete)
  useEffect(() => {
    if (!user || !activeCompany) {
      setClients([]); setOperations([]); setConfig(DEFAULT_CONFIG); setLoading(false);
      return;
    }
    async function fetchAll() {
      setLoading(true);
      const [cRes, oRes, cfgRes, pRes] = await Promise.all([
        supabase.from("clients").select("*").eq("company_id", activeCompany.id).is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("operations").select("*, operation_items(*, products(*))").eq("company_id", activeCompany.id).is("deleted_at", null).order("data", { ascending: false }),
        supabase.from("configs").select("*").eq("company_id", activeCompany.id).limit(1).single(),
        supabase.from("products").select("*").eq("company_id", activeCompany.id).order("name", { ascending: true }),
      ]);
      if (cRes.data) setClients(cRes.data.map(mapClient));
      if (oRes.data) setOperations(oRes.data.map(mapOperation));
      if (pRes.data) setProducts(pRes.data.map(mapProduct));
      if (cfgRes.data) {
        const d = cfgRes.data as any;
        setConfig({ taxaPF: Number(d.taxa_pf), taxaPJ: Number(d.taxa_pj), taxaMaquina: Number(d.taxa_maquina), taxaLiquida: d.taxa_liquida !== undefined ? Number(d.taxa_liquida) : 15 });
      }
      setLoading(false);
    }
    fetchAll();
  }, [user, activeCompany]);

  // Realtime — também respeita soft delete
  useEffect(() => {
    if (!user || !activeCompany) return;
    const channel = supabase
      .channel(`app-realtime-${activeCompany.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `company_id=eq.${activeCompany.id}` }, async (payload) => {
        if (payload.eventType === "INSERT") {
          if (!(payload.new as any).deleted_at) setClients(prev => [mapClient(payload.new), ...prev]);
        } else if (payload.eventType === "UPDATE") {
          const n = payload.new as any;
          if (n.deleted_at) {
            setClients(prev => prev.filter(c => c.id !== n.id));
          } else {
            setClients(prev => {
              const exists = prev.some(c => c.id === n.id);
              return exists ? prev.map(c => c.id === n.id ? mapClient(n) : c) : [mapClient(n), ...prev];
            });
          }
        } else if (payload.eventType === "DELETE") {
          setClients(prev => prev.filter(c => c.id !== (payload.old as any).id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "operations", filter: `company_id=eq.${activeCompany.id}` }, async (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const n = payload.new as any;
          if (n.deleted_at) {
            setOperations(prev => prev.filter(o => o.id !== n.id));
          } else {
            // Para garantir que temos os itens e produtos relacionados, buscamos a operação completa
            const { data, error } = await supabase
              .from("operations")
              .select("*, operation_items(*, products(*))")
              .eq("id", n.id)
              .single();
            
            if (data && !data.deleted_at) {
              setOperations(prev => {
                const exists = prev.some(o => o.id === data.id);
                const mapped = mapOperation(data);
                if (exists) {
                  return prev.map(o => o.id === data.id ? mapped : o);
                } else {
                  return [mapped, ...prev].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
                }
              });
            } else if (data?.deleted_at) {
              setOperations(prev => prev.filter(o => o.id !== n.id));
            }
          }
        } else if (payload.eventType === "DELETE") {
          setOperations(prev => prev.filter(o => o.id !== (payload.old as any).id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `company_id=eq.${activeCompany.id}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setProducts(prev => [mapProduct(payload.new), ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        } else if (payload.eventType === "UPDATE") {
          setProducts(prev => {
            const n = payload.new as any;
            const exists = prev.some(p => p.id === n.id);
            const newList = exists ? prev.map(p => p.id === n.id ? mapProduct(n) : p) : [mapProduct(n), ...prev];
            return newList.sort((a, b) => a.name.localeCompare(b.name));
          });
        } else if (payload.eventType === "DELETE") {
          setProducts(prev => prev.filter(p => p.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeCompany]);

  const getClientRate = useCallback((client: Client) => {
    if (client.taxa > 0) return client.taxa;
    return client.tipo === "PF" ? config.taxaPF : config.taxaPJ;
  }, [config]);

  const addClient = useCallback(async (c: Omit<Client, "id" | "createdAt">) => {
    if (!user || !activeCompany) return;
    const { data, error } = await supabase.from("clients").insert({
      user_id: user.id, company_id: activeCompany.id, nome: c.nome, tipo: c.tipo, taxa: Number(c.taxa), cor: c.cor || "#a855f7"
    }).select().single();
    if (error) { console.error("Erro ao inserir cliente:", error.message); return; }
    if (data) {
      const desc = logCriarCliente({ responsavel: getUserName(), nomeCliente: c.nome, tipo: c.tipo });
      await registrarLog({ ...logBase(), action: "criar", entity: "cliente", entityId: data.id, description: desc, afterData: { nome: c.nome, tipo: c.tipo } });
      supabase.functions.invoke("discord-notify", {
        body: { type: "novo_cliente", nome: c.nome, responsavel: getUserName() },
      }).catch(console.error);
    }
  }, [user, getUserName, logBase]);

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
    await registrarLog({ ...logBase(), action: "editar", entity: "cliente", entityId: id, description: desc, beforeData: old, afterData: updatePayload });
  }, [user, clients, getUserName, logBase]);

  // SOFT DELETE — marca deleted_at; também faz soft-delete em cascata nas operações do cliente
  const deleteClient = useCallback(async (id: string) => {
    if (!user) return;
    const old = clients.find(cl => cl.id === id);
    const now = new Date().toISOString();
    await supabase.from("operations").update({ deleted_at: now }).eq("client_id", id).is("deleted_at", null);
    const { error } = await supabase.from("clients").update({ deleted_at: now }).eq("id", id);
    if (error) { console.error("Erro ao excluir cliente:", error.message); return; }
    const desc = logExcluirCliente({ responsavel: getUserName(), nomeCliente: old?.nome || "---" });
    await registrarLog({ ...logBase(), action: "excluir", entity: "cliente", entityId: id, description: desc, beforeData: old });
  }, [user, clients, getUserName, logBase]);

  const addOperation = useCallback(async (o: { 
    clientId: string; 
    valorBruto: number; 
    responsavel?: string; 
    pix?: string | null;
    category?: ProductCategory;
    items?: { productId: string; quantity: number; unitPrice: number; subtotal: number }[]
  }) => {
    if (!user || !activeCompany) return;
    const client = clients.find(c => c.id === o.clientId);
    if (!client) return;
    
    const category = o.category || "dinheiro";
    let taxa = 0;
    let lucroBruto = 0;
    let custoMaquina = 0;
    let lucroLiquido = 0;
    let valorCliente = 0;

    if (category === "itens") {
      // Venda de itens: o lucro é o valor bruto total (100% de margem no sistema)
      taxa = 0;
      lucroBruto = o.valorBruto;
      custoMaquina = 0;
      lucroLiquido = o.valorBruto;
      valorCliente = 0;
    } else {
      // Operação de dinheiro (lavagem): lógica padrão de taxas
      taxa = getClientRate(client);
      lucroBruto = o.valorBruto * (taxa / 100);
      custoMaquina = o.valorBruto * (config.taxaMaquina / 100);
      lucroLiquido = lucroBruto - custoMaquina;
      valorCliente = o.valorBruto - lucroBruto;
    }
    const responsavel = o.responsavel || getUserName();
    const pix = o.pix && /^\d+$/.test(o.pix) ? o.pix : null;

    const { data, error } = await supabase.from("operations").insert({
      user_id: user.id, 
      client_id: o.clientId, 
      company_id: activeCompany.id, 
      valor_bruto: o.valorBruto,
      taxa_percentual: taxa, 
      lucro_bruto: lucroBruto, 
      custo_maquina: custoMaquina,
      lucro_liquido: lucroLiquido, 
      valor_cliente: valorCliente, 
      responsavel,
      pix,
      category
    } as any).select().single();

    if (data) {
      // Se houver itens, inserir na tabela vinculada
      if (o.items && o.items.length > 0) {
        const itemsToInsert = o.items.map(item => ({
          operation_id: data.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal
        }));
        
        await supabase.from("operation_items").insert(itemsToInsert);
        
        // Atualizar estoque
        for (const item of o.items) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            await supabase.from("products").update({
              stock_quantity: Math.max(0, product.stockQuantity - item.quantity)
            }).eq("id", item.productId);
          }
        }
      }

      const desc = logCriarOperacao({ responsavel, nomeCliente: client.nome, valorBruto: o.valorBruto });
      await registrarLog({ ...logBase(), action: "criar", entity: "operação", entityId: data.id, description: desc, afterData: { valorBruto: o.valorBruto, cliente: client.nome, responsavel, pix, category } });
      
      supabase.functions.invoke("discord-notify", {
        body: { type: "nova_operacao", nome: client.nome, responsavel, status: "pendente", category },
      }).catch(console.error);
    }
  }, [user, clients, config, getClientRate, getUserName, logBase, activeCompany, products]);

  const addProduct = useCallback(async (p: Omit<Product, "id" | "createdAt" | "updatedAt" | "companyId">) => {
    if (!user || !activeCompany) return;
    
    // Clean up the payload to avoid camelCase fields being sent to Supabase
    const insertPayload = {
      name: p.name,
      category: p.category,
      type: p.type,
      description: p.description,
      status: p.status,
      percentage: p.percentage,
      base_value: p.baseValue,
      stock_quantity: p.stockQuantity,
      company_id: activeCompany.id
    };

    const { data, error } = await supabase.from("products").insert(insertPayload).select().single();
    
    if (error) { 
      console.error("Erro ao inserir produto:", error.message); 
      throw error;
    }
    
    if (data) {
      await registrarLog({ ...logBase(), action: "criar", entity: "produto", entityId: data.id, description: `${getUserName()} criou o produto ${p.name}`, afterData: p });
    }
  }, [user, activeCompany, logBase, getUserName]);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    if (!user) return;
    
    const updatePayload: any = {};
    if (p.name !== undefined) updatePayload.name = p.name;
    if (p.category !== undefined) updatePayload.category = p.category;
    if (p.type !== undefined) updatePayload.type = p.type;
    if (p.description !== undefined) updatePayload.description = p.description;
    if (p.status !== undefined) updatePayload.status = p.status;
    if (p.percentage !== undefined) updatePayload.percentage = p.percentage;
    if (p.baseValue !== undefined) updatePayload.base_value = p.baseValue;
    if (p.stockQuantity !== undefined) updatePayload.stock_quantity = p.stockQuantity;
    
    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
    if (error) { 
      console.error("Erro ao atualizar produto:", error.message); 
      throw error;
    }
    
    await registrarLog({ ...logBase(), action: "editar", entity: "produto", entityId: id, description: `${getUserName()} editou o produto ${id}`, afterData: p });
  }, [user, logBase, getUserName]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { 
      console.error("Erro ao excluir produto:", error.message); 
      throw error;
    }
    
    await registrarLog({ ...logBase(), action: "excluir", entity: "produto", entityId: id, description: `${getUserName()} excluiu o produto ${id}` });
  }, [user, logBase, getUserName]);

  const updateOperationStatus = useCallback(async (id: string, status: OperationStatus) => {
    if (!user) return;
    const op = operations.find(o => o.id === id);
    const client = op ? clients.find(c => c.id === op.clientId) : null;
    await supabase.from("operations").update({ status }).eq("id", id);
    const desc = logAlterarStatusOperacao({ responsavel: getUserName(), nomeCliente: client?.nome || "---", statusAnterior: op?.status || "---", statusNovo: status });
    await registrarLog({ ...logBase(), action: "status", entity: "operação", entityId: id, description: desc, beforeData: { status: op?.status }, afterData: { status } });
  }, [user, operations, clients, getUserName, logBase]);

  const updateOperationPix = useCallback(async (id: string, pix: string | null) => {
    if (!user) return;
    const op = operations.find(o => o.id === id);
    if (!op) return;
    if (op.status === "concluido" || op.status === "cancelado") {
      console.warn("PIX bloqueado: operação concluída/cancelada");
      return;
    }
    const cleaned = pix && /^\d+$/.test(pix) ? pix : null;
    const { error } = await supabase.from("operations").update({ pix: cleaned } as any).eq("id", id);
    if (error) { console.error("Erro ao atualizar PIX:", error.message); return; }
    const client = clients.find(c => c.id === op.clientId);
    const desc = `${getUserName()} alterou o PIX da operação de ${client?.nome || "---"} de "${op.pix ?? "---"}" para "${cleaned ?? "---"}"`;
    await registrarLog({ ...logBase(), action: "editar", entity: "operação", entityId: id, description: desc, beforeData: { pix: op.pix }, afterData: { pix: cleaned } });
  }, [user, operations, clients, getUserName, logBase]);

  // SOFT DELETE da operação
  const deleteOperation = useCallback(async (id: string) => {
    if (!user) return;
    const op = operations.find(o => o.id === id);
    const client = op ? clients.find(c => c.id === op.clientId) : null;
    const now = new Date().toISOString();
    await supabase.from("operations").update({ deleted_at: now }).eq("id", id);
    const desc = logExcluirOperacao({ responsavel: getUserName(), nomeCliente: client?.nome || "---", valorBruto: op?.valorBruto || 0 });
    await registrarLog({ ...logBase(), action: "excluir", entity: "operação", entityId: id, description: desc, beforeData: op });
  }, [user, operations, clients, getUserName, logBase]);

  const updateConfig = useCallback(async (c: AppConfig) => {
    if (!user || !activeCompany) return;
    const payload: any = { user_id: user.id, company_id: activeCompany.id, taxa_pf: c.taxaPF, taxa_pj: c.taxaPJ, taxa_maquina: c.taxaMaquina, taxa_liquida: c.taxaLiquida };
    const { error } = await supabase.from("configs").upsert(payload);
    if (error) { console.error("Erro ao salvar config:", error.message); return; }
    const campos: string[] = [];
    if (c.taxaPF !== config.taxaPF) campos.push("Taxa PF");
    if (c.taxaPJ !== config.taxaPJ) campos.push("Taxa PJ");
    if (c.taxaMaquina !== config.taxaMaquina) campos.push("Taxa Máquina");
    if (c.taxaLiquida !== config.taxaLiquida) campos.push("Taxa Líquida");
    const desc = logAlterarConfig({ responsavel: getUserName(), campos });
    await registrarLog({ ...logBase(), action: "config", entity: "configuração", description: desc, beforeData: config, afterData: c });
    setConfig(c);
  }, [user, config, getUserName, logBase]);

  const getStats = useCallback((opsOverride?: Operation[]): DashboardStats => {
    const opsToUse = opsOverride || operations;
    const completed = opsToUse.filter(op => op.status === "concluido");
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
    <AppContext.Provider value={{ 
      clients, operations, products, config, loading, 
      addClient, updateClient, deleteClient, 
      addProduct, updateProduct, deleteProduct,
      addOperation, updateOperationStatus, updateOperationPix, deleteOperation, 
      updateConfig, getStats, getClientStats, getClientRate, getUserName 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
