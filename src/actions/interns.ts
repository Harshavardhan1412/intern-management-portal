'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

export async function createIntern(form: {
  name: string
  email: string
  password: string
  domain: string
  skills: string[]
  college: string
  phone: string
}) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const adminAuthClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {}
      }
    }
  )

  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email: form.email,
    password: form.password,
    email_confirm: true,
    user_metadata: { full_name: form.name },
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? 'Failed to create user' }
  }

  const { error: internError } = await supabase.from('interns').insert({
    user_id: authData.user.id,
    join_date: new Date().toISOString().split('T')[0],
    status: 'active',
    domain: form.domain || null,
    skills: form.skills,
    college: form.college || null,
    phone: form.phone || null,
  })

  if (internError) {
    return { success: false, error: internError.message }
  }

  return { success: true, userId: authData.user.id }
}

export async function updateIntern(userId: string, internId: string, form: {
  name: string
  skills: string[]
  college: string
  phone: string
}) {
  const adminAuthClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  await adminAuthClient.auth.admin.updateUserById(userId, {
    user_metadata: { full_name: form.name }
  })
  
  await adminAuthClient.from('users').update({ full_name: form.name }).eq('id', userId)

  const { error } = await adminAuthClient.from('interns').update({
    skills: form.skills,
    college: form.college || null,
    phone: form.phone || null,
  }).eq('id', internId)

  return { success: !error, error: error?.message }
}

export async function deleteIntern(userId: string, internId: string) {
  const adminAuthClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )

  // Cascade delete manually since RLS blocks it and schema lacks ON DELETE CASCADE
  await adminAuthClient.from('leave_requests').delete().eq('intern_id', internId)
  await adminAuthClient.from('attendance').delete().eq('intern_id', internId)
  await adminAuthClient.from('evaluations').delete().eq('intern_id', internId)
  await adminAuthClient.from('tasks').delete().eq('assigned_to', internId)
  await adminAuthClient.from('project_members').delete().eq('intern_id', internId)
  await adminAuthClient.from('announcement_reads').delete().eq('intern_id', internId)
  
  await adminAuthClient.from('interns').delete().eq('id', internId)
  await adminAuthClient.from('users').delete().eq('id', userId)
  const { error } = await adminAuthClient.auth.admin.deleteUser(userId)
  
  return { success: !error, error: error?.message }
}
