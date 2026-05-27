-- Create categories enum
DO $$ BEGIN
    CREATE TYPE product_category AS ENUM ('itens', 'dinheiro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category product_category NOT NULL DEFAULT 'itens',
    type TEXT, -- Custom type/tag
    base_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ativo', -- ativo / inativo
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operation_items table
CREATE TABLE IF NOT EXISTS public.operation_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category to operations if not exists
DO $$ BEGIN
    ALTER TABLE public.operations ADD COLUMN category product_category DEFAULT 'dinheiro';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_items ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_items TO authenticated;
GRANT ALL ON public.operation_items TO service_role;

-- Policies for products
CREATE POLICY "Users can view products of their company" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_companies
            WHERE user_companies.company_id = products.company_id
            AND user_companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage products of their company" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_companies
            WHERE user_companies.company_id = products.company_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Policies for operation_items
CREATE POLICY "Users can view operation_items" ON public.operation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.operations
            JOIN public.user_companies ON operations.company_id = user_companies.company_id
            WHERE operations.id = operation_items.operation_id
            AND user_companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage operation_items" ON public.operation_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.operations
            JOIN public.user_companies ON operations.company_id = user_companies.company_id
            WHERE operations.id = operation_items.operation_id
            AND user_companies.user_id = auth.uid()
        )
    );

-- Trigger for products updated_at
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_products_updated_at();
