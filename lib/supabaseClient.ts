import { createClient } from '@supabase/supabase-js'

// These must be set in your environment (e.g., .env.local) for the frontend
// NEXT_PUBLIC_SUPABASE_URL=
// NEXT_PUBLIC_SUPABASE_ANON_KEY=

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-url') || supabaseAnonKey.includes('your-anon-key')) {
  // We purposely do not throw; components can detect absence and disable interactions
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars are not properly configured. Authentication will be disabled.')
}

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-url') && 
  !supabaseAnonKey.includes('your-anon-key') &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
