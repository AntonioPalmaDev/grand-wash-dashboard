-- 1. Drop all existing profile policies to start fresh
DROP POLICY IF EXISTS "Profiles individual select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles company members select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles master admin select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles company isolation" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;

-- 2. Enable RLS (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: User can ALWAYS see and manage their own profile (zero recursion)
CREATE POLICY "profiles_self_access" ON public.profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Users can see profiles of others in the same company
-- We use a direct check on user_companies which doesn't check profiles
CREATE POLICY "profiles_company_access" ON public.profiles
    FOR SELECT
    USING (
        company_id IN (
            SELECT uc.company_id 
            FROM public.user_companies uc 
            WHERE uc.user_id = auth.uid()
        )
    );

-- 5. Policy: Master Admins can see all profiles
-- To avoid recursion, we check a static flag on the current user's profile
-- but we use a non-recursive approach by filtering the user_id first
CREATE POLICY "profiles_admin_access" ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_admin
            WHERE p_admin.user_id = auth.uid() 
            AND p_admin.is_master_admin = true
            AND p_admin.id != public.profiles.id -- Avoid self-referencing loop in same row
        )
    );
