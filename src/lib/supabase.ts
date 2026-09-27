import { createClient } from '@supabase/supabase-js'

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'odyigokrixnvrglngvfc'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : '') ||
  'https://odyigokrixnvrglngvfc.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

export default supabase