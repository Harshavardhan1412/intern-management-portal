'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, CheckCircle, XCircle } from 'lucide-react'

export default function AdminTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [interns, setInterns] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadTasks()
    Promise.all([
      supabase.from('interns').select('id, user_id').eq('status', 'active'),
      supabase.from('users').select('id, full_name'),
    ]).then(([internsRes, usersRes]) => {
      if (!internsRes.data || !usersRes.data) return
      const userMap = Object.fromEntries(usersRes.data.map((u: any) => [u.id, u.full_name]))
      setInterns(internsRes.data.map((i: any) => ({ id: i.id, full_name: userMap[i.user_id] ?? '?' })))
    })
  }, [user])

  const loadTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*, intern:assigned_to(id, users:user_id(full_name))').order('created_at', { ascending: false })
    if (error) console.error('load tasks error:', error)
    if (data) setTasks(data)
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...form, created_by: user?.id, status: 'pending' }
    if (!payload.assigned_to) delete payload.assigned_to
    const { error } = await supabase.from('tasks').insert(payload)
    if (error) { alert('Failed to create: ' + error.message); return }
    setShowModal(false)
    setForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
    loadTasks()
  }

  const reviewTask = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('tasks').update({ status, approved_at: new Date().toISOString() }).eq('id', id)
    if (error) { alert('Review failed: ' + error.message); return }
    loadTasks()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Task Management</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Create Task
        </button>
      </div>

      {tasks.map((t) => (
        <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{t.title}</p>
            <p className="text-xs text-slate-500">
              {t.intern?.users?.full_name ?? 'Unassigned'} · Due {new Date(t.due_date).toLocaleDateString()} · {t.priority}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            t.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
            t.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
            t.status === 'rejected' ? 'bg-red-100 text-red-700' :
            t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500'
          }`}>{t.status}</span>
          {t.status === 'submitted' && (
            <div className="flex gap-1">
              <button onClick={() => reviewTask(t.id, 'approved')} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><CheckCircle size={16} /></button>
              <button onClick={() => reviewTask(t.id, 'rejected')} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><XCircle size={16} /></button>
            </div>
          )}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">Create Task</h3>
            <form onSubmit={createTask} className="space-y-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Assign to...</option>
                {interns.map((i: any) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
              </select>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
