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

    if (!intern) return NextResponse.json({ error: 'Intern not found' }, { status: 404 })

    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const startDate = lastMonth.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', intern.id)
      .gte('date', startDate)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
