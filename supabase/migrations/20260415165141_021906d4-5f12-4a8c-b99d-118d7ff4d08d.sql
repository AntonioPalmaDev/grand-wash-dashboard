
-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN status text NOT NULL DEFAULT 'pendente';
ALTER TABLE public.profiles ADD COLUMN motivo_rejeicao text;

-- Set existing users as approved
UPDATE public.profiles SET status = 'aprovado';

-- Update the handle_new_user function to set status as pendente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, role, status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email, 'gestao', 'pendente');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'gestao');
  
  RETURN NEW;
END;
$function$;
