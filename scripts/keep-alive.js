
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * keepAliveSupabase
 * 
 * Simple script to keep the Supabase project active.
 * This can be run manually or as a backup to the automated cron job.
 */
async function keepAliveSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\x1b[36m%s\x1b[0m', '--- Manual Keep-Alive Ping Started ---');
  console.log(`Time: ${new Date().toLocaleString()}`);

  try {
    // Perform a light read-only query
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) throw error;

    console.log('\x1b[32m%s\x1b[0m', 'Success: Supabase project is awake and responding.');
    console.log(`Details: Connection established, found ${count} record(s) in profiles.`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Keep-alive ping failed:');
    console.error(error.message);
    process.exit(1);
  }
}

keepAliveSupabase();
