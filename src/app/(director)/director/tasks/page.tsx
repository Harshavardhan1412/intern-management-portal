'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Search, Clock, User } from 'lucide-react'

export default function DirectorTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('tasks').select('*, interns!inner(id, user_id, users:user_id(full_name, email))').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTasks(data)
    })
  }, [])

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.interns?.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor: Record<string, string> = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    submitted: '#8B5CF6',
    approved: '#10B981',
    rejected: '#EF4444',
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Tasks</h2>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks or assignee..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none" style={{ borderColor: '#E2E8F0' }} />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#94A3B8' }}>No tasks found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>Task</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>Assignee</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>Priority</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748B' }}>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b hover:bg-slate-50" style={{ borderColor: '#F1F5F9' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: '#0F172A' }}>{t.title}</p>
                    {t.description && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{t.description.slice(0, 60)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={14} style={{ color: '#94A3B8' }} />
                      <span style={{ color: '#475569' }}>{t.interns?.users?.full_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.priority === 'high' || t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      t.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor[t.status] || '#94A3B8' }} />
                      <span className="capitalize" style={{ color: '#475569' }}>{t.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                      <Clock size={12} />
                      {new Date(t.due_date).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
