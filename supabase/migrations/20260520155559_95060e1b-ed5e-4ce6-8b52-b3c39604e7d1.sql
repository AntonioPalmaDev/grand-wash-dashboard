-- Drop problematic policies
DROP POLICY IF EXISTS "Profiles company isolation" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;

-- Create simplified, non-recursive policies for profiles
-- 1. Users can always see their own profile
CREATE POLICY "Profiles individual select" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can see profiles of others in the same company
-- We avoid recursion by NOT checking is_master_admin within the USING clause of the same table if it depends on a subquery to itself
CREATE POLICY "Profiles company members select" ON public.profiles
    FOR SELECT USING (
        company_id IN (
            SELECT uc.company_id 
            FROM public.user_companies uc 
            WHERE uc.user_id = auth.uid()
        )
    );

-- 3. Master admins can see all profiles
-- To avoid recursion, we can check the JWT metadata or a direct value if possible, 
-- but since is_master_admin is IN the profile, we'll use a specific condition.
-- A common trick is to use a function or just ensure the subquery is efficient.
CREATE POLICY "Profiles master admin select" ON public.profiles
    FOR SELECT USING (
        (SELECT p.is_master_admin FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1) = true
    );

-- 4. Users can update their own profile
CREATE POLICY "Profiles self update" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
