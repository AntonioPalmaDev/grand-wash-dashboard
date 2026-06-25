
ALTER TABLE public.weapon_parts ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_weapon_parts_name ON public.weapon_parts (name);
CREATE INDEX IF NOT EXISTS idx_weapon_parts_sku ON public.weapon_parts (sku);
CREATE INDEX IF NOT EXISTS idx_weapon_parts_status ON public.weapon_parts (status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='weapon_parts_unit_cost_check') THEN
    ALTER TABLE public.weapon_parts ADD CONSTRAINT weapon_parts_unit_cost_check CHECK (unit_cost >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='weapon_parts_stock_check') THEN
    ALTER TABLE public.weapon_parts ADD CONSTRAINT weapon_parts_stock_check CHECK (stock_quantity >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='weapon_parts_status_check') THEN
    ALTER TABLE public.weapon_parts ADD CONSTRAINT weapon_parts_status_check CHECK (status IN ('ativo','inativo'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_weapon_parts_updated_at ON public.weapon_parts;
CREATE TRIGGER update_weapon_parts_updated_at
  BEFORE UPDATE ON public.weapon_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.module_settings (module_key, module_name, enabled)
VALUES ('pecas_armas', 'Peças de Armas', true)
ON CONFLICT (module_key) DO NOTHING;
