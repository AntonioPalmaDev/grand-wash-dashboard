-- Update products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 5;

-- Update operations table to better support product-only operations
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS total_items_quantity INTEGER DEFAULT 0;

-- Comments for clarity
COMMENT ON COLUMN public.products.min_stock_alert IS 'Quantidade mínima para disparar alerta de estoque baixo';
COMMENT ON COLUMN public.operations.total_items_quantity IS 'Quantidade total de itens vendidos nesta operação';

-- Ensure permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations TO authenticated;
GRANT ALL ON public.operations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_items TO authenticated;
GRANT ALL ON public.operation_items TO service_role;
