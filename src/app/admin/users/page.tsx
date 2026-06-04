import { supabaseAdmin } from '@/lib/supabase/admin'
import { RespondentsContent } from '@/components/users/RespondentsContent'

export type Question  = { key: string; ordinal: number; label: string; type: string }
export type ROption   = { respondent_id: string; question_key: string; option_value: string }
export type Pii       = { respondent_id: string; webshop_url: string | null; email: string | null }
export type Response  = Record<string, unknown> & { respondent_id: string; submitted_at: string | null }

export default async function AdminUsersPage() {
  const [
    { data: responses },
    { data: rOptions },
    { data: pii },
    { data: questions },
  ] = await Promise.all([
    supabaseAdmin.from('responses').select('*').order('submitted_at', { ascending: false }),
    supabaseAdmin.from('response_options').select('respondent_id,question_key,option_value').limit(20000),
    supabaseAdmin.from('respondent_pii').select('respondent_id,webshop_url,email'),
    supabaseAdmin.from('questions').select('key,ordinal,label,type').order('ordinal'),
  ])

  return (
    <RespondentsContent
      responses={(responses ?? []) as Response[]}
      rOptions={rOptions ?? []}
      pii={pii ?? []}
      questions={(questions ?? []) as Question[]}
    />
  )
}
