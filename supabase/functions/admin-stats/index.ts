import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create regular client to verify user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin (has @corruptionwatchdog.in email)
    if (!user.email?.endsWith('@corruptionwatchdog.in')) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get total users count
    const { data: authUsers, error: authError2 } = await supabaseAdmin.auth.admin.listUsers()
    const totalUsers = authUsers?.users?.length || 0

    // Get report statistics
    const { data: allReports, error: reportsError } = await supabaseAdmin
      .from('corruption_reports')
      .select('id, is_anonymous, status, created_at')

    if (reportsError) {
      throw reportsError
    }

    const totalReports = allReports?.length || 0
    const anonymousReports = allReports?.filter((r: any) => r.is_anonymous).length || 0
    const verifiedReports = allReports?.filter((r: any) => r.status === 'verified').length || 0
    const pendingReports = allReports?.filter((r: any) => r.status === 'pending').length || 0
    const resolvedReports = allReports?.filter((r: any) => r.status === 'resolved').length || 0
    const disputedReports = allReports?.filter((r: any) => r.status === 'disputed').length || 0

    // Get this month's statistics
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const reportsThisMonth = allReports?.filter((r: any) => 
      new Date(r.created_at) >= thisMonth
    ).length || 0

    const usersThisMonth = authUsers?.users?.filter((u: any) => 
      new Date(u.created_at) >= thisMonth
    ).length || 0

    const stats = {
      totalUsers,
      totalReports,
      anonymousReports,
      verifiedReports,
      pendingReports,
      resolvedReports,
      disputedReports,
      reportsThisMonth,
      usersThisMonth
    }

    return new Response(
      JSON.stringify({ data: stats }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in admin-stats function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})