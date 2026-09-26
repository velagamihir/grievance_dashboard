import { createClient } from '@supabase/supabase-js'
import { auth } from './firebase'

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || ''

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : '') ||
  'https://placeholder-project.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    accessToken: async () => {
      const user = auth.currentUser

      if (!user) {
        return null
      }

      return await user.getIdToken()
    }
  }
)

export default supabase