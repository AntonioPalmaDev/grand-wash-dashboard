-- Adiciona a coluna company_id
ALTER TABLE public.audit_logs 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Cria um índice para melhorar a performance das buscas por empresa
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para visualizar logs: 
-- Usuário deve ter acesso à empresa do log ou ser desenvolvedor
CREATE POLICY "Users can view audit logs of their companies" 
ON public.audit_logs 
FOR SELECT 
USING (
  company_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE user_companies.company_id = audit_logs.company_id 
    AND user_companies.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'desenvolvedor'
  )
);

-- Política para inserir logs:
-- Qualquer usuário autenticado pode inserir logs
CREATE POLICY "Anyone can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para deletar logs (apenas desenvolvedores)
CREATE POLICY "Only developers can delete logs" 
ON public.audit_logs 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'desenvolvedor'
  )
);
