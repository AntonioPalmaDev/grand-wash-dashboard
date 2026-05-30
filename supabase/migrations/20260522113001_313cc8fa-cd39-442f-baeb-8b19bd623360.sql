-- Check if there's a constraint on role
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        -- We don't necessarily need to add a constraint if we want flexibility, 
        -- but if there is one, we might need to update it.
        -- For now, let's just make sure the column exists (it does).
    END IF;
END $$;
