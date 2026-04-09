
-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('PF', 'PJ')),
  taxa NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own clients" ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create operations table
CREATE TABLE public.operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  valor_bruto NUMERIC NOT NULL,
  taxa_percentual NUMERIC NOT NULL,
  lucro_bruto NUMERIC NOT NULL,
  custo_maquina NUMERIC NOT NULL,
  lucro_liquido NUMERIC NOT NULL,
  valor_cliente NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
  responsavel TEXT NOT NULL DEFAULT 'Sistema',
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own operations" ON public.operations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create configs table
CREATE TABLE public.configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  taxa_pf NUMERIC NOT NULL DEFAULT 30,
  taxa_pj NUMERIC NOT NULL DEFAULT 25,
  taxa_maquina NUMERIC NOT NULL DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own config" ON public.configs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
