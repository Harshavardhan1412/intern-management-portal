'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CalendarOff, Plus } from 'lucide-react'

export default function LeavePage() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState<any[]>([])
  const [internId, setInternId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ leave_type: 'sick', start_date: '', end_date: '', reason: '' })

  useEffect(() => {
    if (!user) return
    supabase.from('interns').select('id').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setInternId(data.id)
        supabase.from('leave_requests').select('*').eq('intern_id', data.id).order('created_at', { ascending: false }).then(({ data: leaves }) => {
          if (leaves) setLeaves(leaves)
        })
      }
    })
  }, [user])

  const applyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!internId) return
    await supabase.from('leave_requests').insert({ intern_id: internId, ...form })
    setShowModal(false)
    setForm({ leave_type: 'sick', start_date: '', end_date: '', reason: '' })
    const { data } = await supabase.from('leave_requests').select('*').eq('intern_id', internId).order('created_at', { ascending: false })
    if (data) setLeaves(data)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Leave Requests</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Apply Leave
        </button>
      </div>

      {leaves.map((l) => (
        <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-slate-100"><CalendarOff size={18} className="text-slate-600" /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 capitalize">{l.leave_type} Leave</p>
            <p className="text-xs text-slate-500">{l.start_date} → {l.end_date}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
            l.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>{l.status}</span>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">Apply for Leave</h3>
            <form onSubmit={applyLeave} className="space-y-4">
              <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500">From</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="text-xs text-slate-500">To</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave..." rows={3} required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
