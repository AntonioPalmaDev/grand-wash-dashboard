
-- 1) audit_logs: drop permissive SELECT
DROP POLICY IF EXISTS "All authenticated can view logs" ON public.audit_logs;

-- 2) clients: drop permissive SELECT/UPDATE, add company-scoped UPDATE
DROP POLICY IF EXISTS "All authenticated can view clients" ON public.clients;
DROP POLICY IF EXISTS "All authenticated can update clients" ON public.clients;

CREATE POLICY "Clients update company scoped"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  OR public.is_master_admin(auth.uid())
)
WITH CHECK (
  company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  OR public.is_master_admin(auth.uid())
);

-- 3) configs: drop permissive SELECT
DROP POLICY IF EXISTS "All authenticated can view configs" ON public.configs;

-- 4) operations: drop permissive SELECT/UPDATE, add company-scoped UPDATE
DROP POLICY IF EXISTS "All authenticated can view operations" ON public.operations;
DROP POLICY IF EXISTS "All authenticated can update operations" ON public.operations;

CREATE POLICY "Operations update company scoped"
ON public.operations
FOR UPDATE
TO authenticated
USING (
  company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  OR public.is_master_admin(auth.uid())
)
WITH CHECK (
  company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  OR public.is_master_admin(auth.uid())
);

-- 5) user_roles: drop permissive SELECT, add scoped SELECT
DROP POLICY IF EXISTS "All authenticated can view roles" ON public.user_roles;

CREATE POLICY "Users view roles in their companies"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_master_admin(auth.uid())
  OR company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
);

-- 6) invitations: restrict SELECT to authenticated users (no anonymous enumeration)
DROP POLICY IF EXISTS "Public can view active invitations by token" ON public.invitations;

CREATE POLICY "Authenticated can view active invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  ((status = 'pending' AND expires_at > now()))
  OR public.is_master_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id = invitations.company_id
  )
);

-- 7) profiles: prevent privilege escalation via is_master_admin column
CREATE OR REPLACE FUNCTION public.prevent_master_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_master_admin IS DISTINCT FROM OLD.is_master_admin
     AND NOT public.is_master_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to modify is_master_admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_master_admin_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_master_admin_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_master_admin_escalation();

-- 8) storage.objects: restrict logo update/delete to master admins
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar logos" ON storage.objects;

CREATE POLICY "Master admins can update company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company_logos' AND public.is_master_admin(auth.uid()))
WITH CHECK (bucket_id = 'company_logos' AND public.is_master_admin(auth.uid()));

CREATE POLICY "Master admins can delete company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company_logos' AND public.is_master_admin(auth.uid()));
