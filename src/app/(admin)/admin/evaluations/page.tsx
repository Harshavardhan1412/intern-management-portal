'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Star, CheckCircle, XCircle } from 'lucide-react'

export default function AdminEvaluationsPage() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [interns, setInterns] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    intern_id: '', period_label: '', task_score: 0, attendance_score: 0,
    communication_score: 0, initiative_score: 0, comments: '',
  })

  useEffect(() => {
    if (user?.role !== 'admin') return
    supabase.from('evaluations').select('*, intern:intern_id(id, users:user_id(full_name))').order('evaluated_at', { ascending: false }).then(({ data }) => {
      if (data) setEvaluations(data)
    })
    supabase.from('interns').select('id, users:user_id(full_name)').eq('status', 'active').then(({ data }) => {
      if (data) setInterns(data)
    })
  }, [user])

  const createEval = async (e: React.FormEvent) => {
    e.preventDefault()
    const overall = ((form.task_score + form.attendance_score + form.communication_score + form.initiative_score) / 4).toFixed(2)
    await supabase.from('evaluations').insert({ ...form, overall_score: overall, admin_id: user?.id })
    setShowModal(false)
    setForm({ intern_id: '', period_label: '', task_score: 0, attendance_score: 0, communication_score: 0, initiative_score: 0, comments: '' })
    const { data } = await supabase.from('evaluations').select('*, intern:intern_id(id, users:user_id(full_name))').order('evaluated_at', { ascending: false })
    if (data) setEvaluations(data)
  }

  const publishEval = async (id: string) => {
    await supabase.from('evaluations').update({ is_published: true }).eq('id', id)
    const { data } = await supabase.from('evaluations').select('*, intern:intern_id(id, users:user_id(full_name))').order('evaluated_at', { ascending: false })
    if (data) setEvaluations(data)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Evaluations</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> New Evaluation
        </button>
      </div>

      {evaluations.map((e) => (
        <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-slate-900">{e.intern?.users?.full_name}</p>
              <p className="text-sm text-slate-500">{e.period_label}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-indigo-600">{e.overall_score}</span>
              {e.is_published ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Published</span>
              ) : (
                <button onClick={() => publishEval(e.id)} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full hover:bg-amber-200">Publish</button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3 text-sm">
            <div><span className="text-slate-400">Tasks</span><p className="font-medium">{e.task_score}/10</p></div>
            <div><span className="text-slate-400">Attendance</span><p className="font-medium">{e.attendance_score}/10</p></div>
            <div><span className="text-slate-400">Communication</span><p className="font-medium">{e.communication_score}/10</p></div>
            <div><span className="text-slate-400">Initiative</span><p className="font-medium">{e.initiative_score}/10</p></div>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">New Evaluation</h3>
            <form onSubmit={createEval} className="space-y-4">
              <select value={form.intern_id} onChange={(e) => setForm({ ...form, intern_id: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select intern...</option>
                {interns.map((i: any) => <option key={i.id} value={i.id}>{i.users?.full_name}</option>)}
              </select>
              <input value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} placeholder="e.g. Week 3, Month 1" required className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500">Task Score (0-10)</label><input type="number" min={0} max={10} step={0.1} value={form.task_score} onChange={(e) => setForm({ ...form, task_score: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-xs text-slate-500">Attendance (0-10)</label><input type="number" min={0} max={10} step={0.1} value={form.attendance_score} onChange={(e) => setForm({ ...form, attendance_score: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-xs text-slate-500">Communication (0-10)</label><input type="number" min={0} max={10} step={0.1} value={form.communication_score} onChange={(e) => setForm({ ...form, communication_score: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-xs text-slate-500">Initiative (0-10)</label><input type="number" min={0} max={10} step={0.1} value={form.initiative_score} onChange={(e) => setForm({ ...form, initiative_score: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} placeholder="Feedback comments..." rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
