-- Drop the restrictive select policy
DROP POLICY IF EXISTS "companies_view_policy" ON public.companies;

-- Create a more permissive select policy for the selection screen
-- This allows all authenticated users to see the list of companies
CREATE POLICY "Authenticated users can view companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

-- Ensure Master Admin policy remains (if it was somehow affected)
-- It's already there but just for consistency in this migration scope
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master admins can do everything on companies' AND tablename = 'companies') THEN
        CREATE POLICY "Master admins can do everything on companies"
        ON public.companies
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE user_id = auth.uid()
                AND is_master_admin = true
            )
        );
    END IF;
END $$;
