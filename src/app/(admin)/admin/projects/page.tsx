'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, FolderKanban } from 'lucide-react'

export default function AdminProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', tech_stack: '', repo_url: '' })

  useEffect(() => {
    if (user?.role !== 'admin') return
    supabase.from('projects').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setProjects(data)
    })
  }, [user])

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('projects').insert({
      ...form,
      created_by: user?.id,
      status: 'planning',
      progress_percent: 0,
      tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
    })
    setShowModal(false)
    setForm({ title: '', description: '', tech_stack: '', repo_url: '' })
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (data) setProjects(data)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Projects</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Create Project
        </button>
      </div>

      {projects.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-900">{p.title}</h3>
              <p className="text-sm text-slate-500">{p.description?.slice(0, 100)}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              p.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              p.status === 'on_hold' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-500'
            }`}>{p.status}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${p.progress_percent}%` }} /></div>
          <p className="text-xs text-slate-500 mt-1 text-right">{p.progress_percent}%</p>
          {p.tech_stack?.length > 0 && (
            <div className="flex gap-1 mt-3 flex-wrap">
              {p.tech_stack.map((t: string) => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t}</span>)}
            </div>
          )}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">Create Project</h3>
            <form onSubmit={createProject} className="space-y-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project name" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} placeholder="Tech stack (comma-separated)" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={form.repo_url} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} placeholder="GitHub repo URL" className="w-full px-3 py-2 border rounded-lg text-sm" />
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
