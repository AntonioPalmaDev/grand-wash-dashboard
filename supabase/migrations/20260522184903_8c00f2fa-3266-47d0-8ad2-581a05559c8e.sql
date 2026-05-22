-- Adicionar coluna logo_url se não existir
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Criar bucket para logos de empresas se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir visualização pública de logos
CREATE POLICY "Logos são publicamente visíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'company_logos');

-- Política para permitir upload apenas para usuários autenticados (Idealmente restrito a admins via app)
CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company_logos' AND auth.role() = 'authenticated');

-- Política para permitir atualização e deleção (Idealmente restrito a admins via app)
CREATE POLICY "Usuários autenticados podem atualizar logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company_logos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company_logos' AND auth.role() = 'authenticated');