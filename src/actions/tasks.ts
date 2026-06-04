'use server'

import { createClient } from '@supabase/supabase-js'

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

export async function createTask(data: any) {
  try {
    const { data: result, error } = await supabaseAdmin
      .from('tasks')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateTask(id: string, data: any) {
  try {
    const { data: result, error } = await supabaseAdmin
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
