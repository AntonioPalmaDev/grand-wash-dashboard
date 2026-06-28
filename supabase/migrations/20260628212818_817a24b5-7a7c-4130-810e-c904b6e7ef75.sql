
-- SALES
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  client_id uuid NULL,
  client_name_snapshot text NULL,
  status text NOT NULL DEFAULT 'pendente',
  total_sale_value numeric NOT NULL DEFAULT 0,
  total_base_cost numeric NOT NULL DEFAULT 0,
  total_parts_cost numeric NOT NULL DEFAULT 0,
  real_profit numeric NOT NULL DEFAULT 0,
  real_margin numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_by_email text NULL,
  created_by_name text NULL,
  sale_date timestamptz NOT NULL DEFAULT now(),
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  CONSTRAINT sales_status_check CHECK (status IN ('pendente','concluido','cancelado'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select_auth" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_insert_self" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "sales_update_owner_or_admin" ON public.sales FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin_master') OR public.has_role(auth.uid(),'desenvolvedor'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin_master') OR public.has_role(auth.uid(),'desenvolvedor'));
CREATE POLICY "sales_delete_dev" ON public.sales FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin_master') OR public.has_role(auth.uid(),'desenvolvedor'));

CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SALE ITEMS
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  product_name_snapshot text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_sale_price numeric NOT NULL DEFAULT 0,
  total_sale_price numeric NOT NULL DEFAULT 0,
  base_cost_snapshot numeric NOT NULL DEFAULT 0,
  parts_cost_snapshot numeric NOT NULL DEFAULT 0,
  real_profit numeric NOT NULL DEFAULT 0,
  real_margin numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_items_select_auth" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "sale_items_modify_via_sale" ON public.sale_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id
    AND (auth.uid() = s.created_by OR public.has_role(auth.uid(),'admin_master') OR public.has_role(auth.uid(),'desenvolvedor'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id
    AND (auth.uid() = s.created_by OR public.has_role(auth.uid(),'admin_master') OR public.has_role(auth.uid(),'desenvolvedor'))));

-- SALE ITEM COMPONENTS
CREATE TABLE public.sale_item_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id uuid NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  part_id uuid NULL,
  part_name_snapshot text NOT NULL,
  quantity_used numeric NOT NULL DEFAULT 1,
  unit_cost_snapshot numeric NOT NULL DEFAULT 0,
  total_cost_snapshot numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_item_components TO authenticated;
GRANT ALL ON public.sale_item_components TO service_role;
ALTER TABLE public.sale_item_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sic_select_auth" ON public.sale_item_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "sic_modify_via_item" ON public.sale_item_components FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sale_items si JOIN public.sales s ON s.id = si.sale_id
    WHERE si.id = sale_item_id
      AND (auth.uid() = s.created_by OR public.has_role(auth.uid(),'admin_master') OR public.has_role(auth.uid(),'desenvolvedor'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sale_items si JOIN public.sales s ON s.id = si.sale_id
    WHERE si.id = sale_item_id
      AND (auth.uid() = s.created_by OR public.has_role(auth.uid(),'admin_master') OR public.has_role(auth.uid(),'desenvolvedor'))
  ));

CREATE INDEX sales_status_idx ON public.sales(status) WHERE deleted_at IS NULL;
CREATE INDEX sales_created_by_idx ON public.sales(created_by);
CREATE INDEX sale_items_sale_idx ON public.sale_items(sale_id);
CREATE INDEX sic_item_idx ON public.sale_item_components(sale_item_id);
