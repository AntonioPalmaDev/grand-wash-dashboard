-- Drop existing restrictive policies on invitations
DROP POLICY IF EXISTS "Authorized users can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Authorized users can view company invitations" ON public.invitations;
DROP POLICY IF EXISTS "Management can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Public can view active invitations by token" ON public.invitations;

-- Fix Invitations Policies using is_master_admin(auth.uid()) function for consistency
CREATE POLICY "Public can view active invitations by token" 
ON public.invitations 
FOR SELECT 
TO public, authenticated
USING (
  (status = 'pending' AND expires_at > now()) OR
  is_master_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND company_id = invitations.company_id
  )
);

CREATE POLICY "Authorized users can create invitations" 
ON public.invitations 
FOR INSERT 
TO authenticated 
WITH CHECK (
  (is_master_admin(auth.uid()) OR 
   EXISTS (
     SELECT 1 FROM public.user_roles 
     WHERE user_id = auth.uid() AND company_id = invitations.company_id AND role IN ('gestao', 'desenvolvedor')
   )
  ) AND created_by = auth.uid()
);

CREATE POLICY "Management can manage invitations" 
ON public.invitations 
FOR ALL 
TO authenticated 
USING (
  is_master_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND company_id = invitations.company_id AND role = 'gestao'
  )
);

-- Update Companies Policy to allow public viewing via invitation
-- This is critical for the InvitePage to work for logged-out users
DROP POLICY IF EXISTS "companies_view_policy" ON public.companies;
CREATE POLICY "companies_view_policy" 
ON public.companies 
FOR SELECT 
TO public, authenticated
USING (
  active = true OR 
  is_master_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.user_id = auth.uid() AND user_companies.company_id = companies.id
  ) OR
  EXISTS (
    SELECT 1 FROM public.invitations 
    WHERE invitations.company_id = companies.id AND invitations.status = 'pending' AND invitations.expires_at > now()
  )
);
