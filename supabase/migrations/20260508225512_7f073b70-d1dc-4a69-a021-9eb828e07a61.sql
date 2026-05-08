ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS pix text;

ALTER TABLE public.operations ADD CONSTRAINT operations_pix_numeric_check
  CHECK (pix IS NULL OR pix ~ '^[0-9]+$');

CREATE INDEX IF NOT EXISTS idx_operations_pix ON public.operations(pix);

CREATE OR REPLACE FUNCTION public.prevent_pix_update_when_completed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status IN ('concluido', 'cancelado')
     AND NEW.pix IS DISTINCT FROM OLD.pix THEN
    RAISE EXCEPTION 'Não é permitido alterar o PIX de uma operação concluída ou cancelada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_pix_update_when_completed ON public.operations;
CREATE TRIGGER trg_prevent_pix_update_when_completed
BEFORE UPDATE ON public.operations
FOR EACH ROW
EXECUTE FUNCTION public.prevent_pix_update_when_completed();