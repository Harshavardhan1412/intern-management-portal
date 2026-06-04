import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: intern } = await supabase
      .from('interns')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!intern) {
      return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', intern.id)
      .eq('date', today)
      .single()

    // It's okay if not found, just means not checked in today
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || null }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
