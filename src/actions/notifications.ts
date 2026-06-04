'use server'

import { createClient } from '@supabase/supabase-js'

export async function sendReminder(userId: string, title: string, body: string) {
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

  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'reminder',
    title: title,
    body: body,
  })

  return { success: !error, error: error?.message }
}

export async function broadcastAnnouncementNotification(title: string, body: string, relatedId: string) {
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

  // Fetch all interns to broadcast
  const { data: interns, error: fetchError } = await supabaseAdmin
    .from('interns')
    .select('user_id')

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  if (!interns || interns.length === 0) {
    return { success: true }
  }

  // Create notification rows for all interns
  const notificationsToInsert = interns.map((intern) => ({
    user_id: intern.user_id,
    type: 'announcement',
    title: `New Announcement: ${title}`,
    body: body,
    related_id: relatedId,
    is_read: false
  }))

  const { error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(notificationsToInsert)

  return { success: !insertError, error: insertError?.message }
}
