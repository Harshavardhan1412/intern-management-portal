import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if admin
    const { data: authUser } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (authUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly' // weekly or monthly

    const now = new Date()
    let startDate = new Date()
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate.setMonth(now.getMonth() - 1)
    }
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        interns (
          id,
          user_id,
          users:user_id ( full_name, email ),
          groups:group_id ( name )
        )
      `)
      .gte('date', startDateStr)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process reports on the server side to save client processing if needed,
    // or just return the raw data and let the client dashboard aggregate it.
    // For now, return raw data so client can build flexible reports.
    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
