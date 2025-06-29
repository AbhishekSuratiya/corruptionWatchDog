import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface RequestFilters {
  search?: string;
  hasReports?: boolean;
  limit?: number;
  offset?: number;
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

    // Parse request body for filters
    let filters: RequestFilters = {}
    if (req.method === 'POST') {
      filters = await req.json()
    } else if (req.method === 'GET') {
      const url = new URL(req.url)
      filters = {
        search: url.searchParams.get('search') || undefined,
        hasReports: url.searchParams.get('hasReports') ? url.searchParams.get('hasReports') === 'true' : undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      }
    }

    // Get users using admin client
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: filters.offset ? Math.floor(filters.offset / (filters.limit || 50)) + 1 : 1,
      perPage: filters.limit || 50
    })

    if (usersError) {
      throw usersError
    }

    if (!authUsers?.users) {
      return new Response(
        JSON.stringify({ data: [], count: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get report counts for each user
    const { data: reportCounts, error: reportError } = await supabaseAdmin
      .from('corruption_reports')
      .select('reporter_email')
      .not('reporter_email', 'is', null)

    // Count reports by email
    const reportCountMap = new Map<string, number>()
    if (reportCounts) {
      reportCounts.forEach((report: any) => {
        if (report.reporter_email) {
          const count = reportCountMap.get(report.reporter_email) || 0
          reportCountMap.set(report.reporter_email, count + 1)
        }
      })
    }

    // Transform users data
    let users = authUsers.users.map((user: any) => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      user_metadata: user.user_metadata || {},
      report_count: reportCountMap.get(user.email || '') || 0
    }))

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      users = users.filter((user: any) => 
        user.email.toLowerCase().includes(searchLower) ||
        user.user_metadata.full_name?.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower)
      )
    }

    if (filters.hasReports !== undefined) {
      users = users.filter((user: any) => 
        filters.hasReports ? user.report_count > 0 : user.report_count === 0
      )
    }

    // Sort by creation date (newest first)
    users.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return new Response(
      JSON.stringify({ 
        data: users, 
        count: users.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in admin-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})