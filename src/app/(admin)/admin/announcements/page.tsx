'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Send } from 'lucide-react'
import { broadcastAnnouncementNotification } from '@/actions/notifications'

export default function AdminAnnouncementsPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', target_audience: 'all', is_pinned: false })

  useEffect(() => {
    if (user?.role !== 'admin') return
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data)
    })
  }, [user])

  const publish = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: newAnno } = await supabase.from('announcements').insert({
      ...form, created_by: user?.id, published_at: new Date().toISOString(),
    }).select().single()

    if (newAnno && form.target_audience === 'all') {
      await broadcastAnnouncementNotification(form.title, form.body, newAnno.id)
    }

    setShowModal(false)
    setForm({ title: '', body: '', target_audience: 'all', is_pinned: false })
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Announcements</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> New Announcement
        </button>
      </div>

      {announcements.map((a) => (
        <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5">
          {a.is_pinned && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mb-2 inline-block">Pinned</span>}
          <h3 className="font-semibold text-slate-900">{a.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{a.body}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
            <span>{new Date(a.published_at ?? a.created_at).toLocaleDateString()}</span>
            <span className="capitalize">· {a.target_audience}</span>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">New Announcement</h3>
            <form onSubmit={publish} className="space-y-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Announcement content..." rows={5} required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="all">All</option>
                <option value="batch">Batch</option>
                <option value="group">Group</option>
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} className="rounded" /> Pin this announcement</label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"><Send size={16} /> Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
