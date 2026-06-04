import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { internId, selfieUrl, latitude, longitude } = await request.json()

    if (!internId || !selfieUrl || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Check if already checked in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', internId)
      .eq('date', today)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
    }

    const now = new Date()
    const checkInTime = now.toISOString()
    
    // Simple logic for late check-in (e.g., after 10:00 AM local time)
    // Assuming office starts at 10:00 AM
    const isLate = now.getHours() >= 10 && now.getMinutes() > 0

    const { data, error } = await supabase.from('attendance').insert({
      intern_id: internId,
      date: today,
      check_in_time: checkInTime,
      selfie_url: selfieUrl,
      latitude,
      longitude,
      status: isLate ? 'late' : 'present',
      is_late: isLate
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Check-in successful' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
