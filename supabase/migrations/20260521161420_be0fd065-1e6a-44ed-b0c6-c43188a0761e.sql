-- Drop all existing policies for invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Public can view active invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Admins/Managers can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins/Managers can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view specific invitation details" ON public.invitations;
DROP POLICY IF EXISTS "Admins/Managers can manage invitations" ON public.invitations;

-- Ensure RLS is enabled
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 1. INSERT POLICY: Allow users with 'gestao' or 'desenvolvedor' roles to create invitations
-- Note: We use existing app_role values
CREATE POLICY "Authorized users can create invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
    (
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
    )
    AND (created_by = auth.uid())
);

-- 2. SELECT POLICY: 
CREATE POLICY "Authorized users can view company invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = invitations.company_id
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_master_admin = true
    )
);

CREATE POLICY "Public can view active invitations by token"
ON public.invitations
FOR SELECT
TO public
USING (
    status = 'pending' 
    AND expires_at > now()
);

-- 3. UPDATE/DELETE POLICY
CREATE POLICY "Management can manage invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = invitations.company_id
        AND role = 'gestao'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_master_admin = true
    )
);
