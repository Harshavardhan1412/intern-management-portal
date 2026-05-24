'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

export async function updateProfile(form: {
  userId: string
  fullName: string
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

  const { error: userError } = await supabase
    .from('users')
    .update({ full_name: form.fullName })
    .eq('id', form.userId)

  if (userError) return { success: false, error: userError.message }

  const updateData: Record<string, any> = {}
  if (form.skills.length) updateData.skills = form.skills
  if (form.college) updateData.college = form.college
  if (form.phone) updateData.phone = form.phone

  if (Object.keys(updateData).length > 0) {
    const { error: internError } = await supabase
      .from('interns')
      .update(updateData)
      .eq('user_id', form.userId)

    if (internError) return { success: false, error: internError.message }
  }

  return { success: true }
}

export async function changePassword(form: {
  currentPassword: string
  newPassword: string
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

  const { error } = await supabase.auth.updateUser({ password: form.newPassword })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
