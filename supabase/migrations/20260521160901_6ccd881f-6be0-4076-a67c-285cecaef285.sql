-- Drop existing policies to recreate them with better clarity
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- 1. Allow any authenticated user to CREATE an invitation
-- (Validation of permissions to invite for a specific company can be handled at the application level or via a more complex policy if needed)
CREATE POLICY "Users can create invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = invitations.company_id
        AND role IN ('gestao', 'desenvolvedor')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_master_admin = true
    )
);

-- 2. Admins/Managers can VIEW, UPDATE, and DELETE invitations for their company
CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = invitations.company_id
        AND role IN ('gestao')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_master_admin = true
    )
);

-- 3. PUBLIC access to view invitation by token (needed for the landing page)
CREATE POLICY "Public can view active invitation by token"
ON public.invitations
FOR SELECT
TO public
USING (status = 'pending' AND expires_at > now());
