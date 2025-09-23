import { createClient } from '@supabase/supabase-js'

// These must be set in your environment (e.g., .env.local) for the frontend
// NEXT_PUBLIC_SUPABASE_URL=
// NEXT_PUBLIC_SUPABASE_ANON_KEY=

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // We purposely do not throw; components can detect absence and disable interactions
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars are missing. Likes/Saves will be disabled until configured.')
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any)
