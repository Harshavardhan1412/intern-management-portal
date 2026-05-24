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
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

export async function deleteIntern(userId: string) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  await supabase.from('interns').delete().eq('user_id', userId)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  return { success: !error, error: error?.message }
}
