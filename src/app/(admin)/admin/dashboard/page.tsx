'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Users, ClipboardCheck, CheckCircle, FolderKanban, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ interns: 0, attendance: 0, tasks: 0, projects: 0 })

  useEffect(() => {
    const load = async () => {
      const { count: internCount } = await supabase.from('interns').select('*', { count: 'exact' }).eq('status', 'active')
      const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact' })
      const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact' })
      setStats({ interns: internCount ?? 0, attendance: 0, tasks: taskCount ?? 0, projects: projectCount ?? 0 })
    }
    load()
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Platform overview at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20} />, label: 'Active Interns', value: stats.interns, color: 'bg-indigo-100 text-indigo-600', href: '/admin/interns' },
          { icon: <ClipboardCheck size={20} />, label: 'Today\'s Attendance', value: stats.attendance, color: 'bg-emerald-100 text-emerald-600', href: '/admin/attendance' },
          { icon: <CheckCircle size={20} />, label: 'Total Tasks', value: stats.tasks, color: 'bg-amber-100 text-amber-600', href: '/admin/tasks' },
          { icon: <FolderKanban size={20} />, label: 'Active Projects', value: stats.projects, color: 'bg-rose-100 text-rose-600', href: '/admin/projects' },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/interns" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Intern Management</h3>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-1">Add, edit, or deactivate intern profiles</p>
        </Link>
        <Link href="/admin/attendance" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 transition-colors group">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Attendance Report</h3>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-1">View daily attendance and approve corrections</p>
        </Link>
      </div>
    </div>
  )
}
