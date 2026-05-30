-- Drop old company policy
DROP POLICY IF EXISTS "Companies access" ON public.companies;

-- Create a robust non-recursive policy for companies
-- 1. Linked users can see the company
CREATE POLICY "Companies access linked" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT uc.company_id 
            FROM public.user_companies uc 
            WHERE uc.user_id = auth.uid()
        )
    );

-- 2. Master admins can see all companies
-- We check is_master_admin from the current user's profile without joining back to companies
CREATE POLICY "Companies access master" ON public.companies
    FOR SELECT USING (
        (SELECT p.is_master_admin FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1) = true
    );
