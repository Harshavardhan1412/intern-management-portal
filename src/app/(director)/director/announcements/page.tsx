'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Megaphone, User, Calendar } from 'lucide-react'
import { broadcastAnnouncementNotification } from '@/actions/notifications'

export default function DirectorAnnouncements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })
  const [sending, setSending] = useState(false)

  const load = () => {
    supabase.from('announcements').select('*, users:created_by(full_name)').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data)
    })
  }

  useEffect(() => { load() }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSending(true)
    const { data: newAnno } = await supabase.from('announcements').insert({
      title: form.title,
      body: form.body,
      created_by: user.id,
      target_audience: 'all',
      published_at: new Date().toISOString(),
    }).select().single()

    if (newAnno) {
      await broadcastAnnouncementNotification(form.title, form.body, newAnno.id)
    }

    setForm({ title: '', body: '' })
    setShowModal(false)
    setSending(false)
    load()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Announcements</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors" style={{ backgroundColor: '#14B8A6' }}>
          <Plus size={18} /> New Announcement
        </button>
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#94A3B8' }}>No announcements yet</div>
        ) : announcements.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border p-5" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                <Megaphone size={18} style={{ color: '#D97706' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold" style={{ color: '#0F172A' }}>{a.title}</h3>
                <p className="text-sm mt-1" style={{ color: '#475569' }}>{a.body}</p>
                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#94A3B8' }}>
                  <span className="flex items-center gap-1"><User size={12} /> {a.users?.full_name || 'Unknown'}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>New Announcement</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" style={{ borderColor: '#CBD5E1' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Message</label>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required rows={4} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none resize-none" style={{ borderColor: '#CBD5E1' }} />
              </div>
              <p className="text-xs" style={{ color: '#94A3B8' }}>This will be visible to all interns and admins.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>Cancel</button>
                <button type="submit" disabled={sending} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#14B8A6' }}>{sending ? 'Sending...' : 'Send'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
