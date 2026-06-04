import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { internId } = await request.json()

    if (!internId) {
      return NextResponse.json({ error: 'Missing internId' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Get existing checkin
    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', internId)
      .eq('date', today)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'No check-in found for today' }, { status: 404 })
    }

    if (existing.check_out_time) {
      return NextResponse.json({ error: 'Already checked out today' }, { status: 400 })
    }

    const checkOutTime = new Date().toISOString()
    
    // Removed totalHours and tasksSubmitted calculation as they are now dynamically calculated on the dashboard

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

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({
        check_out_time: checkOutTime
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Check-out successful' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
