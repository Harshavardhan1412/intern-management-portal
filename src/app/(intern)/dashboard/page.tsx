'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { LayoutDashboard, Clock, CheckCircle, Bell, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function InternDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ tasks: 0, completed: 0, attendance: '--', notifications: 0 })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data: intern } = await supabase.from('interns').select('id').eq('user_id', user.id).single()
      if (!intern) return

      const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact' }).eq('assigned_to', intern.id)
      const { count: doneCount } = await supabase.from('tasks').select('*', { count: 'exact' }).eq('assigned_to', intern.id).eq('status', 'approved')
      const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', user.id).eq('is_read', false)

      setStats({ tasks: taskCount ?? 0, completed: doneCount ?? 0, attendance: '--', notifications: notifCount ?? 0 })
    }
    load()
  }, [user])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900">Welcome back, {user?.fullName?.split(' ')[0] ?? 'Intern'}!</h2>
        <p className="text-sm text-slate-500 mt-1">Here is your summary for today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <LayoutDashboard size={20} />, label: 'Today\'s Tasks', value: stats.tasks, color: 'bg-indigo-100 text-indigo-600' },
          { icon: <CheckCircle size={20} />, label: 'Completed', value: stats.completed, color: 'bg-emerald-100 text-emerald-600' },
          { icon: <Clock size={20} />, label: 'Attendance Rate', value: stats.attendance, color: 'bg-amber-100 text-amber-600' },
          { icon: <Bell size={20} />, label: 'Notifications', value: stats.notifications, color: 'bg-rose-100 text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/tasks" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Pending Tasks</h3>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-1">You have {stats.tasks - stats.completed} tasks to complete</p>
        </Link>
        <Link href="/attendance" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Today's Attendance</h3>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Mark your attendance for today</p>
        </Link>
      </div>
    </div>
  )
}
