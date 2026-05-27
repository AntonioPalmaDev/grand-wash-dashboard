-- Grant permissions for products table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- Grant permissions for operation_items table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_items TO authenticated;
GRANT ALL ON public.operation_items TO service_role;

-- Ensure RLS is enabled (should already be, but good to be sure)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_items ENABLE ROW LEVEL SECURITY;
