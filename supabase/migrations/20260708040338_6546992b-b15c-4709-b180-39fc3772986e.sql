
-- 1. anonymous_tokens: remove public SELECT
DROP POLICY IF EXISTS "Anyone can verify tokens" ON public.anonymous_tokens;

-- 2. audit_logs: drop loose insert + duplicate delete; tighten SELECT
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only developers can delete logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view audit logs of their companies" ON public.audit_logs;

CREATE POLICY "Users can view audit logs of their companies"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = audit_logs.company_id
      AND user_companies.user_id = auth.uid()
  ))
  OR public.has_role(auth.uid(), 'desenvolvedor'::app_role)
);

-- 3. companies: drop invitation-based public branch
DROP POLICY IF EXISTS "companies_view_policy" ON public.companies;

CREATE POLICY "companies_view_policy"
ON public.companies
FOR SELECT
TO authenticated
USING (
  active = true
  OR public.is_master_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.user_id = auth.uid()
      AND user_companies.company_id = companies.id
  )
);

-- 4. invitations: scope SELECT to recipient/company members/master
DROP POLICY IF EXISTS "Authenticated can view active invitations" ON public.invitations;

CREATE POLICY "Authenticated can view active invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  public.is_master_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = invitations.company_id
  )
  OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

-- 5. company_logos upload: restrict to user's own company folder
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de logos" ON storage.objects;

CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company_logos'
  AND (
    public.is_master_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id::text = split_part(name, '/', 1)
    )
  )
);

-- 6. Lock search_path on remaining functions
CREATE OR REPLACE FUNCTION public.is_master_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = p_user_id
        AND is_master_admin = true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
