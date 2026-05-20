I will create an automated keep-alive routine for your Supabase project to prevent it from being paused due to inactivity.

### Technical Details
- **Edge Function**: A new Supabase Edge Function `keep-alive` will be created using Deno (compatible with Supabase JS) to perform a lightweight query.
- **Scheduling**: I will use a database migration to enable the `pg_cron` extension and schedule the function to run every 5 days.
- **Logs**: Success and error messages will be recorded in the Supabase Edge Function logs.
- **Security**: The function will use the `SERVICE_ROLE_KEY` securely on the server side.

### Implementation Steps
1. **Create Edge Function**: Write the logic for `keep-alive` in `supabase/functions/keep-alive/index.ts`.
2. **Database Migration**: 
   - Enable `pg_cron` and `pg_net` extensions.
   - Create a scheduled job that calls the Edge Function every 5 days.
3. **Deployment**: Deploy the Edge Function to Supabase.
