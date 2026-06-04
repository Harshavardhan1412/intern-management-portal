'use server'

import { createClient } from '@supabase/supabase-js'

export async function updateLeaveStatus(leaveId: string, status: string, adminId?: string) {
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

  const updateData: any = { status }
  if (adminId) {
    updateData.admin_id = adminId
    updateData.actioned_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from('leave_requests')
    .update(updateData)
    .eq('id', leaveId)

  return { success: !error, error: error?.message }
}
