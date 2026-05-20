import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('--- Keep-Alive Routine Started ---')
    console.log(`Timestamp: ${new Date().toISOString()}`)

    // Execute a simple read-only query to keep the project active
    // We use a simple select on a table that usually exists
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) {
      console.error('Database query failed:', error.message)
      throw error
    }

    console.log('Keep-alive query successful. Database is active.')
    console.log(`Connection check result: Found ${count} profile(s).`)
    
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Project is awake',
        timestamp: new Date().toISOString(),
        details: { profiles_count: count }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('--- Keep-Alive Routine Failed ---')
    console.error('Error details:', err)

    return new Response(
      JSON.stringify({
        status: 'error',
        message: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
