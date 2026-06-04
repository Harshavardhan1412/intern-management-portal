'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { FolderKanban, Link as LinkIcon, ExternalLink, Loader2 } from 'lucide-react'
import { getInternPortalData } from '@/actions/groups'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  progress_percent: number
  tech_stack: string[]
  repo_url: string | null
  demo_url: string | null
  created_at: string
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getInternPortalData(user.id).then((data) => {
      setProjects(data.projects || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm text-slate-500">Loading your projects...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FolderKanban className="text-indigo-600" size={24} />
          My Projects
        </h2>
        <p className="text-sm text-slate-500 mt-1">View your assigned projects, technology stacks, and external resources.</p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto mt-10 shadow-sm">
          <FolderKanban className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-800">No Projects Assigned</h3>
          <p className="text-sm text-slate-500 mt-1">You haven't been assigned to any projects yet. Please contact the administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{p.title}</h3>
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wider ${
                      p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      p.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      p.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>{p.status.replace('_', ' ')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 shrink-0"><FolderKanban size={20} className="text-indigo-600" /></div>
                </div>
                
                {p.description && (
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{p.description}</p>
                )}

                {p.tech_stack && p.tech_stack.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {p.tech_stack.map((t) => (
                      <span key={t} className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Assigned Files & Links */}
                {(p.repo_url || p.demo_url) && (
                  <div className="pt-3.5 border-t border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Files & Resource Links</h4>
                    <div className="flex flex-col gap-2">
                      {p.repo_url && (
                        <a
                          href={p.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-750 hover:underline font-semibold self-start"
                        >
                          <LinkIcon size={14} />
                          GitHub Repository (Source Code)
                        </a>
                      )}
                      {p.demo_url && (
                        <a
                          href={p.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-750 hover:underline font-semibold self-start"
                        >
                          <ExternalLink size={14} />
                          Project Resources / Drive / Figma Link
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-900">{p.progress_percent}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${p.progress_percent}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
