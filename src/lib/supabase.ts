import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Project URL only — not the REST or Auth API path (no /rest/v1/)
const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

if (!isSupabaseConfigured()) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and add your Supabase credentials. Auth will be disabled until then.',
  )
}

/** Null when env vars are missing — app still loads for local UI development. */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your credentials to .env.')
  }
  return supabase
}
