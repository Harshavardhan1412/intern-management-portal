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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Fetch active interns
    const { data: interns, error: internsError } = await supabase
      .from('interns')
      .select(`
        id,
        user_id,
        join_date,
        users:user_id ( full_name, email ),
        groups:group_id ( name )
      `)

    if (internsError) throw internsError

    // Fetch today's attendance
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date)

    // Fetch all attendance for percentages
    const { data: allAttendance } = await supabase
      .from('attendance')
      .select('intern_id, status')

    const result = interns?.map(intern => {
      const todayRecord = todayAttendance?.find(a => a.intern_id === intern.id)
      const internHistory = allAttendance?.filter(a => a.intern_id === intern.id) || []
      
      const totalDays = internHistory.length
      const presentDays = internHistory.filter(a => a.status === 'present').length
      const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

      // Calculate internship duration in months/weeks (approx)
      const joinDate = new Date(intern.join_date)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - joinDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const durationWeeks = Math.floor(diffDays / 7)

      let total_hours = null;
      if (todayRecord?.check_in_time && todayRecord?.check_out_time) {
        const checkIn = new Date(todayRecord.check_in_time)
        const checkOut = new Date(todayRecord.check_out_time)
        total_hours = Number(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2))
      }

      return {
        id: intern.id,
        interns: {
          user_id: intern.user_id,
          users: intern.users,
          groups: intern.groups
        },
        status: todayRecord?.status || 'Pending',
        check_in_time: todayRecord?.check_in_time || null,
        check_out_time: todayRecord?.check_out_time || null,
        selfie_url: todayRecord?.selfie_url || null,
        latitude: todayRecord?.latitude || null,
        longitude: todayRecord?.longitude || null,
        total_hours: total_hours,
        tasks_submitted: 0,
        attendance_percent: attendancePercent,
        duration: `${durationWeeks} weeks`
      }
    })

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
