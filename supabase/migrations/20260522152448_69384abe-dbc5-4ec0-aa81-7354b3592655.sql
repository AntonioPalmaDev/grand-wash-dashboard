CREATE TABLE public.anonymous_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.anonymous_tokens ENABLE ROW LEVEL SECURITY;

-- Master Admin can manage tokens
CREATE POLICY "Master Admins can manage anonymous tokens" 
ON public.anonymous_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_master_admin = true
  )
);

-- Public can verify tokens (read-only for non-expired tokens)
CREATE POLICY "Anyone can verify tokens" 
ON public.anonymous_tokens 
FOR SELECT 
USING (is_active = true AND expires_at > now());
