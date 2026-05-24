'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Search, ExternalLink } from 'lucide-react'

export default function DirectorProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('projects').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setProjects(data)
    })
  }, [])

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Projects</h2>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none" style={{ borderColor: '#E2E8F0' }} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="sm:col-span-3 text-center py-16" style={{ color: '#94A3B8' }}>No projects found</div>
        ) : filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border p-5" style={{ borderColor: '#E2E8F0' }}>
            <h3 className="font-semibold mb-1" style={{ color: '#0F172A' }}>{p.title}</h3>
            <p className="text-sm mb-3 line-clamp-2" style={{ color: '#64748B' }}>{p.description || 'No description'}</p>
            <div className="flex items-center justify-between text-xs" style={{ color: '#94A3B8' }}>
              <span className={`px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : p.status === 'planning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
              <span>{p.progress_percent ?? 0}% done</span>
            </div>
            <div className="mt-3 w-full rounded-full h-1.5" style={{ backgroundColor: '#F1F5F9' }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.progress_percent ?? 0}%`, backgroundColor: '#14B8A6' }} />
            </div>
            {p.repo_url && (
              <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-3 text-xs" style={{ color: '#14B8A6' }}>
                <ExternalLink size={12} /> Repository
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
