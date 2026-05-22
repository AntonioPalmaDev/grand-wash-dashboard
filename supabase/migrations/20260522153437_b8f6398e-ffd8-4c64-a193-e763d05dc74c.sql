-- Update handle_new_user to support role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_role app_role;
BEGIN
  -- Get role from metadata or default to gestao
  target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'gestao')::app_role;

  INSERT INTO public.profiles (user_id, nome, email, nome_personagem, role, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', ''), 
    NEW.email, 
    NULLIF(NEW.raw_user_meta_data->>'nome_personagem', ''),
    target_role, 
    'pendente'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, target_role);
  
  RETURN NEW;
END;
$function$;

-- Update existing anonymous user role and status
UPDATE public.profiles 
SET role = 'visualizador', status = 'aprovado' 
WHERE email = 'anonimo@anonimo.com';

-- Ensure user_roles is also updated for the anonymous user
UPDATE public.user_roles
SET role = 'visualizador'
WHERE user_id IN (SELECT user_id FROM public.profiles WHERE email = 'anonimo@anonimo.com');
