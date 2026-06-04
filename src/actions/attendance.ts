'use server'

import { createClient } from '@supabase/supabase-js'

export async function addAttendance(form: {
  intern_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: string
  is_verified: boolean
}) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { error } = await supabaseAdmin.from('attendance').upsert({
    intern_id: form.intern_id,
    date: form.date,
    check_in_time: form.check_in_time,
    check_out_time: form.check_out_time,
    status: form.status,
    is_verified: form.is_verified,
  }, { onConflict: 'intern_id, date' })

  return { success: !error, error: error?.message }
}
