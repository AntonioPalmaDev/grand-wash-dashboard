-- Drop problematic configs policy
DROP POLICY IF EXISTS "Configs company isolation" ON public.configs;

-- Create robust non-recursive policy for configs
CREATE POLICY "Configs access company" ON public.configs
    FOR SELECT USING (
        company_id IN (
            SELECT uc.company_id 
            FROM public.user_companies uc 
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Configs update self company" ON public.configs
    FOR UPDATE USING (
        company_id IN (
            SELECT uc.company_id 
            FROM public.user_companies uc 
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Configs insert self company" ON public.configs
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT uc.company_id 
            FROM public.user_companies uc 
            WHERE uc.user_id = auth.uid()
        )
    );
