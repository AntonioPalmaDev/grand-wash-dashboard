
CREATE TABLE public.weapon_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weapon_parts TO authenticated;
GRANT ALL ON public.weapon_parts TO service_role;
ALTER TABLE public.weapon_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage weapon_parts" ON public.weapon_parts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_weapon_parts_updated_at BEFORE UPDATE ON public.weapon_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.weapons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  base_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weapons TO authenticated;
GRANT ALL ON public.weapons TO service_role;
ALTER TABLE public.weapons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage weapons" ON public.weapons
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_weapons_updated_at BEFORE UPDATE ON public.weapons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.weapon_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weapon_id UUID NOT NULL REFERENCES public.weapons(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.weapon_parts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (weapon_id, part_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weapon_components TO authenticated;
GRANT ALL ON public.weapon_components TO service_role;
ALTER TABLE public.weapon_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage weapon_components" ON public.weapon_components
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_weapon_components_weapon ON public.weapon_components(weapon_id);
CREATE INDEX idx_weapon_components_part ON public.weapon_components(part_id);
