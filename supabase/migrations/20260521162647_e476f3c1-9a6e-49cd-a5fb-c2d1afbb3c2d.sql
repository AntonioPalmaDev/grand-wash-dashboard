-- 1. Garantir coluna na profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'is_master_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_master_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Atualizar o Master Admin específico
UPDATE public.profiles 
SET is_master_admin = true, 
    role = 'desenvolvedor',
    status = 'aprovado'
WHERE email = 'antoniovictor379@yahoo.com.br';

-- 3. Recriar função de Master Admin (mais performática e segura)
CREATE OR REPLACE FUNCTION public.is_master_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE user_id = p_user_id 
        AND is_master_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ajustar RLS para COMPANIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Master admins can do everything on companies" ON public.companies;

-- Política de visualização: Todo mundo autenticado vê empresas ativas, Master vê tudo
CREATE POLICY "companies_view_policy" ON public.companies
FOR SELECT TO authenticated
USING (
    active = true 
    OR is_master_admin(auth.uid()) 
    OR EXISTS (SELECT 1 FROM user_companies WHERE user_id = auth.uid() AND company_id = companies.id)
);

-- Master admin tem poder total
CREATE POLICY "companies_master_all" ON public.companies
FOR ALL TO authenticated
USING (is_master_admin(auth.uid()))
WITH CHECK (is_master_admin(auth.uid()));

-- 5. Ajustar RLS para USER_COMPANIES (memberships)
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_companies_view_policy" ON public.user_companies;
DROP POLICY IF EXISTS "user_companies_insert_policy" ON public.user_companies;

-- Visualização: Usuário vê as suas empresas, Master vê todas as associações
CREATE POLICY "user_companies_select" ON public.user_companies
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_master_admin(auth.uid()));

-- Gestão: Master Admin pode gerenciar associações
CREATE POLICY "user_companies_master_all" ON public.user_companies
FOR ALL TO authenticated
USING (is_master_admin(auth.uid()))
WITH CHECK (is_master_admin(auth.uid()));

-- 6. Ajustar RLS para PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_master_admin_view" ON public.profiles;

-- Visualização: Master vê tudo, Usuário vê o próprio ou de colegas de empresa
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
    user_id = auth.uid() 
    OR is_master_admin(auth.uid())
    OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- Master Admin pode editar qualquer perfil
CREATE POLICY "profiles_master_update" ON public.profiles
FOR UPDATE TO authenticated
USING (is_master_admin(auth.uid()))
WITH CHECK (is_master_admin(auth.uid()));
