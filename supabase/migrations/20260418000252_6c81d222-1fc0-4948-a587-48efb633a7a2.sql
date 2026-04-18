-- 1. Add nome_personagem to profiles (unique)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome_personagem TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nome_personagem_unique 
  ON public.profiles (LOWER(nome_personagem)) 
  WHERE nome_personagem IS NOT NULL;

-- 2. Add nome_personagem to audit_logs for identification
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS nome_personagem TEXT;

-- 3. Soft delete columns
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS operations_deleted_at_idx ON public.operations(deleted_at);
CREATE INDEX IF NOT EXISTS clients_deleted_at_idx ON public.clients(deleted_at);
CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx ON public.profiles(deleted_at);

-- 4. Prevent UPDATE on audit_logs (logs are immutable)
DROP POLICY IF EXISTS "No updates on audit logs" ON public.audit_logs;
-- (No UPDATE policy = no updates allowed by default with RLS enabled)

-- Block updates explicitly via trigger to be safe
CREATE OR REPLACE FUNCTION public.prevent_audit_log_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Logs de auditoria não podem ser editados';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
BEFORE UPDATE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_update();

-- 5. RLS for soft delete - only devs can do hard delete; soft delete is via UPDATE
-- Operations: allow update for soft delete (already exists "All authenticated can update operations")
-- Add restore policy: only devs can restore (set deleted_at = null) — already covered by update policy

-- 6. Drop existing hard delete policies and restrict to devs only (already restricted for operations)
-- Clients delete is currently open; restrict to devs
DROP POLICY IF EXISTS "All authenticated can delete clients" ON public.clients;
CREATE POLICY "Devs can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'desenvolvedor'::app_role));

-- 7. Restore action: just an UPDATE setting deleted_at = NULL — covered by existing update policies
-- But restrict restore (clearing deleted_at) implicitly via app logic + dev-only UI

-- 8. Update handle_new_user to capture nome_personagem from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, nome_personagem, role, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', ''), 
    NEW.email, 
    NULLIF(NEW.raw_user_meta_data->>'nome_personagem', ''),
    'gestao', 
    'pendente'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'gestao');
  
  RETURN NEW;
END;
$function$;