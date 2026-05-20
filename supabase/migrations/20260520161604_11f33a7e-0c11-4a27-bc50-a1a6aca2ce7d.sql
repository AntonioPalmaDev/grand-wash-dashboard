-- 1. Clean up existing policies for companies and user_companies
DROP POLICY IF EXISTS "Companies access linked" ON public.companies;
DROP POLICY IF EXISTS "Companies access master" ON public.companies;
DROP POLICY IF EXISTS "User companies access" ON public.user_companies;
DROP POLICY IF EXISTS "User companies self insert" ON public.user_companies;

-- 2. Simplified policy for companies
-- Users can see companies they are linked to OR if they are master admin
CREATE POLICY "companies_view_policy" ON public.companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
        OR public.is_master_admin(auth.uid())
    );

-- 3. Simplified policy for user_companies
-- Users can see their own links OR all links if they are master admin
CREATE POLICY "user_companies_view_policy" ON public.user_companies
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.is_master_admin(auth.uid())
    );

-- Allow users to link themselves to a company (needed for company creation flow)
CREATE POLICY "user_companies_insert_policy" ON public.user_companies
    FOR INSERT WITH CHECK (user_id = auth.uid());
