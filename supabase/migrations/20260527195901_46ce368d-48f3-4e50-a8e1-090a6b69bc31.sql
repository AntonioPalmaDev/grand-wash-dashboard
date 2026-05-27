ALTER TABLE public.operations ADD COLUMN operation_type TEXT;

COMMENT ON COLUMN public.operations.operation_type IS 'Tipo de operação (ex: lavagem, câmbio, etc) para categorização dinâmica';

-- Re-grant permissions to ensure column is accessible
GRANT SELECT, INSERT, UPDATE ON public.operations TO authenticated;
GRANT ALL ON public.operations TO service_role;