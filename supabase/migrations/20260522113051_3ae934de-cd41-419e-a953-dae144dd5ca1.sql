-- Alter enum type to add new roles
-- We use DO block to check if they already exist to avoid errors
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'visualizador') THEN
        ALTER TYPE public.app_role ADD VALUE 'visualizador';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin_master') THEN
        ALTER TYPE public.app_role ADD VALUE 'admin_master';
    END IF;
END $$;
