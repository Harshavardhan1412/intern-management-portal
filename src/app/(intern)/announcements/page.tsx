'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Megaphone, Calendar } from 'lucide-react'

export default function InternAnnouncementsPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('announcements').select('*').eq('target_audience', 'all').order('published_at', { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data)
    })
  }, [user])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Announcements</h2>
      {announcements.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Megaphone size={48} className="mx-auto mb-3 text-slate-300" /><p>No announcements yet</p></div>
      ) : announcements.map((a) => (
        <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900">{a.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{a.body}</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Calendar size={12} /> {new Date(a.published_at ?? a.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  )
}
