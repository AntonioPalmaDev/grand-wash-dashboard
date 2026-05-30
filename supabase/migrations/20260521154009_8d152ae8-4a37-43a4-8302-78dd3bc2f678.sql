-- Add description and tags to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update RLS policies to ensure master admins can do everything
-- (Assuming they already exist, but making sure)
CREATE POLICY "Master admins can do everything on companies" 
ON public.companies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_master_admin = true
  )
);
