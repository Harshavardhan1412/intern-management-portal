'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Search, User, Star } from 'lucide-react'

export default function DirectorEvaluations() {
  const { user } = useAuth()
  const [interns, setInterns] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('interns')
      .select('id, performance_score, skills, domain, users:user_id(full_name, email)')
      .order('performance_score', { ascending: false })
      .then(({ data }) => {
        if (data) setInterns(data)
      })
  }, [])

  const filtered = interns.filter((i) =>
    i.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.users?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Intern Evaluations</h2>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interns..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none" style={{ borderColor: '#E2E8F0' }} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="sm:col-span-3 text-center py-16" style={{ color: '#94A3B8' }}>No interns found</div>
        ) : filtered.map((i) => (
          <div key={i.id} className="bg-white rounded-xl border p-5" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: i.performance_score >= 80 ? '#10B981' : i.performance_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                {i.users?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: '#0F172A' }}>{i.users?.full_name || 'Unknown'}</p>
                <p className="text-xs truncate" style={{ color: '#94A3B8' }}>{i.users?.email || ''}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#64748B' }}>Performance Score</span>
              <span className="flex items-center gap-1 text-sm font-bold" style={{ color: i.performance_score >= 80 ? '#10B981' : i.performance_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                <Star size={14} /> {i.performance_score}/100
              </span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: '#F1F5F9' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${i.performance_score}%`, backgroundColor: i.performance_score >= 80 ? '#10B981' : i.performance_score >= 60 ? '#F59E0B' : '#EF4444' }} />
            </div>
            {i.domain && (
              <p className="text-xs mt-3" style={{ color: '#94A3B8' }}>Domain: {i.domain}</p>
            )}
            {i.skills?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {i.skills.slice(0, 3).map((s: string) => (
                  <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
