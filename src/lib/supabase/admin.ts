import { createClient } from '@supabase/supabase-js'

// Service-role client — SERVER ONLY (Server Actions / route handlers).
// Never import this in a Client Component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)
