import { NextResponse } from 'next/server'
import { sendDeadlineReminders } from '@/actions/reminders'

export async function GET(request: Request) {
  // Optional security check for production environments
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const secretKey = process.env.CRON_SECRET || 'secret-reminder-key'

  if (process.env.NODE_ENV === 'production' && key !== secretKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendDeadlineReminders()
  if (result.success) {
    return NextResponse.json({ success: true, logs: result.logs })
  } else {
    return NextResponse.json({ success: false, error: result.error, logs: result.logs }, { status: 500 })
  }
}
