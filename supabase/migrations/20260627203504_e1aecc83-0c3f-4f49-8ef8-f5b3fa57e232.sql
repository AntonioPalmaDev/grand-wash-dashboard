
-- Remove estoque (não usaremos mais controle de estoque)
ALTER TABLE public.weapon_parts DROP COLUMN IF EXISTS stock_quantity;
ALTER TABLE public.products DROP COLUMN IF EXISTS stock_quantity;

-- Custo snapshot na composição (custo da peça no momento da associação)
ALTER TABLE public.weapon_components 
  ADD COLUMN IF NOT EXISTS unit_cost_snapshot numeric NOT NULL DEFAULT 0;

-- Vendas de armas
CREATE TABLE IF NOT EXISTS public.weapon_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weapon_id uuid NOT NULL REFERENCES public.weapons(id) ON DELETE RESTRICT,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id uuid,
  responsavel text,
  sale_value numeric NOT NULL DEFAULT 0,
  base_cost_snapshot numeric NOT NULL DEFAULT 0,
  parts_cost_snapshot numeric NOT NULL DEFAULT 0,
  real_profit numeric NOT NULL DEFAULT 0,
  real_margin numeric NOT NULL DEFAULT 0,
  sold_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weapon_sales TO authenticated;
GRANT ALL ON public.weapon_sales TO service_role;
ALTER TABLE public.weapon_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weapon_sales_all_authenticated" ON public.weapon_sales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Snapshots das peças na venda
CREATE TABLE IF NOT EXISTS public.sale_component_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.weapon_sales(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.weapon_parts(id) ON DELETE SET NULL,
  part_name_snapshot text NOT NULL,
  quantity_used integer NOT NULL DEFAULT 1,
  unit_cost_snapshot numeric NOT NULL DEFAULT 0,
  total_cost_snapshot numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_component_snapshots TO authenticated;
GRANT ALL ON public.sale_component_snapshots TO service_role;
ALTER TABLE public.sale_component_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_component_snapshots_all_authenticated" ON public.sale_component_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_weapon_sales_weapon ON public.weapon_sales(weapon_id);
CREATE INDEX IF NOT EXISTS idx_weapon_sales_sold_at ON public.weapon_sales(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_snapshots_sale ON public.sale_component_snapshots(sale_id);
