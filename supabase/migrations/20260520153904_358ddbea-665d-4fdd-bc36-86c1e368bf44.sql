-- Create companies table if not exists
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT,
    primary_color TEXT DEFAULT '#0EA5E9',
    secondary_color TEXT DEFAULT '#6366F1',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create user_companies join table if not exists
CREATE TABLE IF NOT EXISTS public.user_companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Enable RLS for user_companies
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to existing tables (with safety checks)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='company_id') THEN
        ALTER TABLE public.clients ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='company_id') THEN
        ALTER TABLE public.operations ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configs' AND column_name='company_id') THEN
        ALTER TABLE public.configs ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_roles' AND column_name='company_id') THEN
        ALTER TABLE public.user_roles ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_master_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_master_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Insert initial company "Zero Foco"
INSERT INTO public.companies (name, slug, primary_color)
VALUES ('Zero Foco', 'zero-foco', '#0EA5E9')
ON CONFLICT (slug) DO NOTHING;

-- Data Migration
DO $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT id INTO v_company_id FROM public.companies WHERE slug = 'zero-foco' LIMIT 1;
    
    UPDATE public.profiles SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE public.clients SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE public.operations SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE public.configs SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE public.user_roles SET company_id = v_company_id WHERE company_id IS NULL;
    
    INSERT INTO public.user_companies (user_id, company_id)
    SELECT user_id, v_company_id FROM public.profiles
    ON CONFLICT DO NOTHING;
    
    -- Set first developer as master admin
    UPDATE public.profiles SET is_master_admin = true WHERE role = 'desenvolvedor';
END $$;

-- RLS Policies

-- Drop existing restricted policies to recreate them
DROP POLICY IF EXISTS "Companies access" ON public.companies;
DROP POLICY IF EXISTS "User companies access" ON public.user_companies;
DROP POLICY IF EXISTS "Profiles company isolation" ON public.profiles;
DROP POLICY IF EXISTS "Clients company isolation" ON public.clients;
DROP POLICY IF EXISTS "Clients insert company check" ON public.clients;
DROP POLICY IF EXISTS "Operations company isolation" ON public.operations;
DROP POLICY IF EXISTS "Operations insert company check" ON public.operations;
DROP POLICY IF EXISTS "Configs company isolation" ON public.configs;

-- Create new policies
CREATE POLICY "Companies access" ON public.companies
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_companies WHERE user_id = auth.uid() AND company_id = public.companies.id)
        OR (SELECT is_master_admin FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "User companies access" ON public.user_companies
    FOR SELECT USING (user_id = auth.uid() OR (SELECT is_master_admin FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Profiles company isolation" ON public.profiles
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
        OR (SELECT is_master_admin FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients company isolation" ON public.clients
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
        OR (SELECT is_master_admin FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients insert company check" ON public.clients
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Operations company isolation" ON public.operations
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
        OR (SELECT is_master_admin FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Operations insert company check" ON public.operations
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Configs company isolation" ON public.configs
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
        OR (SELECT is_master_admin FROM public.profiles WHERE user_id = auth.uid())
    );
