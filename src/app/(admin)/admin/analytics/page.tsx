'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { BarChart3, Users, ClipboardCheck, CheckCircle } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalInterns: 0, activeInterns: 0, totalTasks: 0, completedTasks: 0,
  })

  useEffect(() => {
    if (user?.role !== 'admin') return
    const load = async () => {
      const { count: total } = await supabase.from('interns').select('*', { count: 'exact' })
      const { count: active } = await supabase.from('interns').select('*', { count: 'exact' }).eq('status', 'active')
      const { count: tasks } = await supabase.from('tasks').select('*', { count: 'exact' })
      const { count: done } = await supabase.from('tasks').select('*', { count: 'exact' }).eq('status', 'approved')
      setStats({ totalInterns: total ?? 0, activeInterns: active ?? 0, totalTasks: tasks ?? 0, completedTasks: done ?? 0 })
    }
    load()
  }, [user])

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
  const activeRate = stats.totalInterns > 0 ? Math.round((stats.activeInterns / stats.totalInterns) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Analytics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-indigo-100"><Users size={20} className="text-indigo-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Interns</p>
              <p className="text-2xl font-bold text-slate-900">{stats.activeInterns} / {stats.totalInterns}</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${activeRate}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{activeRate}% active</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-100"><CheckCircle size={20} className="text-emerald-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Task Completion</p>
              <p className="text-2xl font-bold text-slate-900">{stats.completedTasks} / {stats.totalTasks}</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{completionRate}% completion rate</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Platform Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Interns', value: stats.totalInterns, icon: <Users size={18} /> },
            { label: 'Active Interns', value: stats.activeInterns, icon: <ClipboardCheck size={18} /> },
            { label: 'Total Tasks', value: stats.totalTasks, icon: <BarChart3 size={18} /> },
            { label: 'Completed Tasks', value: stats.completedTasks, icon: <CheckCircle size={18} /> },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-center text-slate-400 mb-1">{s.icon}</div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
