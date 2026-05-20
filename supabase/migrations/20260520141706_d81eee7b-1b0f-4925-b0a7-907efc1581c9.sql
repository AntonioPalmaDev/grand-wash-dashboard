
-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job
-- Note: Replace the URL with your project's URL if it's different, 
-- but we use the project reference directly.
-- The anon key is used here for simplicity as the function handles public access if needed,
-- but we'll use a placeholder or the actual service role key if we can.
-- For a keep-alive, even a failed auth attempt keeps the DB active, 
-- but a successful one is better for logs.

SELECT cron.schedule(
  'keep-alive-every-5-days',
  '0 0 */5 * *',
  $$
  SELECT net.http_post(
    url := 'https://uoynhpdrphhgjfzhmrgt.supabase.co/functions/v1/keep-alive',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveW5ocGRycGhoZ2pmemhtcmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTY0OTcsImV4cCI6MjA5MTI3MjQ5N30.LpqqEBR8P-6-toZ18NSNONddgN6DzyQySipyR2CwijQ"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
