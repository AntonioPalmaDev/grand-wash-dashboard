
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('desenvolvedor', 'gestao');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'gestao',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Function to get user role from profiles (security definer)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 7. Trigger to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email, 'gestao');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'gestao');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. RLS Policies for profiles
CREATE POLICY "All authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Devs can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Devs can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'desenvolvedor'));

-- 10. RLS for user_roles
CREATE POLICY "All authenticated can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Devs can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'desenvolvedor'))
  WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));

-- 11. RLS for audit_logs
CREATE POLICY "All authenticated can view logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 12. Update clients RLS - all authenticated users see and manage all data
DROP POLICY IF EXISTS "Users manage own clients" ON public.clients;

CREATE POLICY "All authenticated can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (true);

-- 13. Update operations RLS
DROP POLICY IF EXISTS "Users manage own operations" ON public.operations;

CREATE POLICY "All authenticated can view operations"
  ON public.operations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can insert operations"
  ON public.operations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated can update operations"
  ON public.operations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated can delete operations"
  ON public.operations FOR DELETE
  TO authenticated
  USING (true);

-- 14. Update configs RLS - all can view, only devs can modify
DROP POLICY IF EXISTS "Users manage own config" ON public.configs;

CREATE POLICY "All authenticated can view configs"
  ON public.configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Devs can manage configs"
  ON public.configs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));

CREATE POLICY "Devs can update configs"
  ON public.configs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'desenvolvedor'));

-- 15. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.configs;
