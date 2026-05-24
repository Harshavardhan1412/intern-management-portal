'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { FolderKanban } from 'lucide-react'

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('interns').select('id').eq('user_id', user.id).single().then(({ data: intern }) => {
      if (!intern) return
      supabase.from('project_members').select('project_id').eq('intern_id', intern.id).then(({ data: memberships }) => {
        if (!memberships?.length) return
        const ids = memberships.map(m => m.project_id)
        supabase.from('projects').select('*').in('id', ids).then(({ data }) => {
          if (data) setProjects(data)
        })
      })
    })
  }, [user])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">My Projects</h2>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FolderKanban size={48} className="mx-auto mb-3 text-slate-300" />
          <p>No projects assigned yet</p>
        </div>
      ) : projects.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-900">{p.title}</h3>
              <p className="text-sm text-slate-500">{p.status}</p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-100"><FolderKanban size={18} className="text-indigo-600" /></div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${p.progress_percent}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">{p.progress_percent}%</p>
        </div>
      ))}
    </div>
  )
}
