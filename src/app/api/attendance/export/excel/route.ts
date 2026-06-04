import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if admin
    const { data: authUser } = await supabase.from('users').select('role').eq('id', user.id).single()
    const isAdmin = authUser?.role === 'admin'

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly'
    const internIdParam = searchParams.get('internId')

    const now = new Date()
    let startDate = new Date()
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'monthly') {
      startDate.setMonth(now.getMonth() - 1)
    }
    const startDateStr = startDate.toISOString().split('T')[0]

    let query = supabase
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

    if (!isAdmin) {
      // If intern, only export own data
      const { data: intern } = await supabase.from('interns').select('id').eq('user_id', user.id).single()
      if (intern) query = query.eq('intern_id', intern.id)
    } else if (internIdParam) {
      query = query.eq('intern_id', internIdParam)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Generate CSV string
    const headers = ['Date', 'Intern Name', 'Email', 'Team', 'Status', 'Check In', 'Check Out', 'Hours', 'Tasks Submitted', 'Admin Note']
    const csvRows = [headers.join(',')]

    for (const record of data) {
      const row = [
        record.date,
        `"${record.interns?.users?.full_name || 'N/A'}"`,
        `"${record.interns?.users?.email || 'N/A'}"`,
        `"${record.interns?.groups?.name || 'N/A'}"`,
        record.status,
        record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '',
        record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '',
        record.total_hours || 0,
        record.tasks_submitted || 0,
        `"${record.admin_note || ''}"`
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance_report_${period}_${new Date().getTime()}.csv"`
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
