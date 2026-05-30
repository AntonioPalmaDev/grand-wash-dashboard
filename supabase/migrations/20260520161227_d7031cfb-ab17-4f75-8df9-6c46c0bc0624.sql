-- 1. Clean up all existing policies on profiles
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_company_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles individual select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles company members select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles master admin select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles company isolation" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;

-- 2. Create a SECURITY DEFINER function to check master admin status
-- This breaks the recursion because the function runs with the privileges of the creator
-- and doesn't trigger the RLS of the profile table when checking the flag.
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Basic self-access policy (Zero recursion)
CREATE POLICY "profiles_self_manage" ON public.profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Company isolation policy (Uses user_companies table, NOT profiles)
CREATE POLICY "profiles_company_shared_view" ON public.profiles
    FOR SELECT
    USING (
        company_id IN (
            SELECT uc.company_id 
            FROM public.user_companies uc 
            WHERE uc.user_id = auth.uid()
        )
    );

-- 5. Master Admin policy (Uses the security definer function to avoid recursion)
CREATE POLICY "profiles_master_admin_view" ON public.profiles
    FOR SELECT
    USING (public.is_master_admin(auth.uid()));

-- 6. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
