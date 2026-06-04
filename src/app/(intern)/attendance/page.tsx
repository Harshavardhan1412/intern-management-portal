'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import AttendanceCards from '@/components/attendance/AttendanceCards'
import CheckInOutCard from '@/components/attendance/CheckInOutCard'
import AttendanceHistoryTable from '@/components/attendance/AttendanceHistoryTable'

export default function AttendancePage() {
  const { user } = useAuth()
  const [internId, setInternId] = useState<string | null>(null)
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttendanceData = async (id: string) => {
    setLoading(true)
    
    // Get today's record
    const today = new Date().toISOString().split('T')[0]
    const { data: todayData } = await supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', id)
      .eq('date', today)
      .single()
      
    setTodayRecord(todayData)

    // Get history
    const { data: historyData } = await supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', id)
      .order('date', { ascending: false })
      
    setHistory(historyData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    supabase.from('interns').select('id').eq('user_id', user.id).single().then(({ data }) => {
      if (data) { 
        setInternId(data.id)
        fetchAttendanceData(data.id) 
      }
    })
  }, [user])

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading attendance data...</div>
  }

  // Calculate stats for the cards
  const totalDays = history.length
  const presentDays = history.filter(r => r.status === 'present').length
  const absentDays = history.filter(r => r.status === 'absent').length
  const weeklyPercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
  
  // Basic streak calculation
  let currentStreak = 0
  for (let i = 0; i < history.length; i++) {
    if (history[i].status === 'present') currentStreak++
    else break
  }

  // Hours this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const hoursWorkedWeek = history
    .filter(r => new Date(r.date) >= oneWeekAgo)
    .reduce((acc, r) => acc + (Number(r.total_hours) || 0), 0)

  const stats = {
    presentDays,
    absentDays,
    totalDays,
    weeklyPercent,
    currentStreak,
    leaveBalance: 12, // Dummy leave balance, adjust as needed
    hoursWorkedWeek: Math.round(hoursWorkedWeek * 10) / 10,
    todayStatus: todayRecord?.status || 'Pending'
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Attendance & Reports</h2>
            <p className="text-slate-500 text-sm mt-1">Track your daily check-ins, working hours, and history.</p>
          </div>
        </div>

        <AttendanceCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CheckInOutCard 
              internId={internId} 
              todayRecord={todayRecord} 
              onSuccess={() => internId && fetchAttendanceData(internId)} 
            />
          </div>
          
          <div className="lg:col-span-2">
            <AttendanceHistoryTable records={history} />
          </div>
        </div>
      </div>
    </div>
  )
}
