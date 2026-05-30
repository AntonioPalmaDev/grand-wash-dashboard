-- Allow users to update their own profile (essential for setting character name)
CREATE POLICY "Profiles self update" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ensure users can insert into user_companies if they are master admins or creating their own link (safety check)
CREATE POLICY "User companies self insert" ON public.user_companies
    FOR INSERT WITH CHECK (user_id = auth.uid());
