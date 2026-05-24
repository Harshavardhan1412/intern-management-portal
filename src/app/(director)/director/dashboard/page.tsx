'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { FolderKanban, ListChecks, CalendarOff, Megaphone, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DirectorDashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState(0)
  const [tasks, setTasks] = useState(0)
  const [leaves, setLeaves] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([p, t, l]) => {
      if (p.count !== null) setProjects(p.count)
      if (t.count !== null) setTasks(t.count)
      if (l.count !== null) setLeaves(l.count)
    })
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#E2E8F0' }}>
        <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Director Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Project and task oversight.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <FolderKanban size={20} />, label: 'Active Projects', value: projects, href: '/director/projects' },
          { icon: <ListChecks size={20} />, label: 'Total Tasks', value: tasks, href: '/director/tasks' },
          { icon: <CalendarOff size={20} />, label: 'Pending Leaves', value: leaves, href: '/director/leaves' },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border p-5 hover:border-purple-200 transition-colors" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg text-white" style={{ backgroundColor: '#14B8A6' }}>{s.icon}</div>
              <div>
                <p className="text-sm" style={{ color: '#64748B' }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: '#0F172A' }}>{s.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/director/tasks" className="bg-white rounded-xl border p-5 hover:border-purple-200 transition-colors group" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: '#0F172A' }}>Task Management</h3>
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" style={{ color: '#14B8A6' }} />
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Assign and track intern tasks</p>
        </Link>
        <Link href="/director/leaves" className="bg-white rounded-xl border p-5 hover:border-purple-200 transition-colors group" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: '#0F172A' }}>Leave Approvals</h3>
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" style={{ color: '#14B8A6' }} />
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Approve or reject leave requests</p>
        </Link>
      </div>
    </div>
  )
}

