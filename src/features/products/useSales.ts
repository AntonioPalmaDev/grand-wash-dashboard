import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SaleItemComponent {
  id: string;
  sale_item_id: string;
  part_id: string | null;
  part_name_snapshot: string;
  quantity_used: number;
  unit_cost_snapshot: number;
  total_cost_snapshot: number;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_sale_price: number;
  total_sale_price: number;
  base_cost_snapshot: number;
  parts_cost_snapshot: number;
  real_profit: number;
  real_margin: number;
  sale_item_components?: SaleItemComponent[];
}

export interface Sale {
  id: string;
  client_id: string | null;
  client_name_snapshot: string | null;
  status: "pendente" | "concluido" | "cancelado";
  total_sale_value: number;
  total_base_cost: number;
  total_parts_cost: number;
  real_profit: number;
  real_margin: number;
  created_by: string;
  created_by_email: string | null;
  created_by_name: string | null;
  sale_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sale_items?: SaleItem[];
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*, sale_items(*, sale_item_components(*))")
      .is("deleted_at", null)
      .order("sale_date", { ascending: false })
      .limit(500);
    if (!error) setSales((data || []) as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSales();
    const ch = supabase
      .channel(`sales-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, fetchSales)
      .on("postgres_changes", { event: "*", schema: "public", table: "sale_items" }, fetchSales)
      .subscribe();
    return () => { supabase.removeChannel(ch); };

  }, [fetchSales]);

  const stats = useMemo(() => {
    const concluded = sales.filter(s => s.status === "concluido");
    const totalVendido = concluded.reduce((a, s) => a + Number(s.total_sale_value), 0);
    const lucroReal = concluded.reduce((a, s) => a + Number(s.real_profit), 0);
    const ticketMedio = concluded.length ? totalVendido / concluded.length : 0;
    const margemMedia = totalVendido > 0 ? (lucroReal / totalVendido) * 100 : 0;
    return {
      totalVendido,
      lucroReal,
      ticketMedio,
      margemMedia,
      concluidas: concluded.length,
      pendentes: sales.filter(s => s.status === "pendente").length,
      canceladas: sales.filter(s => s.status === "cancelado").length,
      total: sales.length,
    };
  }, [sales]);

  return { sales, loading, stats, refetch: fetchSales };
}
