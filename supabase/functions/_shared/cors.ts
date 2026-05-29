export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function optionsResponse() {
  return new Response('ok', { headers: corsHeaders })
}

interface AuthResult {
  userId: string | null
  error: string | null
}

export async function getUserIdFromRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { userId: null, error: 'Missing authorization header.' }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return { userId: null, error: 'Supabase environment is not configured.' }
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: supabaseAnonKey,
    },
  })

  if (!response.ok) {
    return { userId: null, error: 'Invalid or expired session.' }
  }

  const user = await response.json()
  return { userId: user.id ?? null, error: user.id ? null : 'Invalid session.' }
}
