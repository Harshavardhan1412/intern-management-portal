'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, FolderKanban, Users, Edit2, Link, Trash2, X, Loader2, ExternalLink } from 'lucide-react'
import {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getAvailableInternsForProject,
} from '@/actions/projects'

interface Member {
  id: string
  full_name: string
  email: string
  source?: string
}

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
  members?: Member[]
}

export default function AdminProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', description: '', tech_stack: '', repo_url: '', demo_url: '' })
  const [createLoading, setCreateLoading] = useState(false)

  // Member management modal state
  const [memberModalProject, setMemberModalProject] = useState<Project | null>(null)
  const [availableInterns, setAvailableInterns] = useState<Member[]>([])
  const [selectedInternId, setSelectedInternId] = useState<string>('')
  const [memberActionLoading, setMemberActionLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Edit modal state
  const [editModalProject, setEditModalProject] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    tech_stack: '',
    repo_url: '',
    demo_url: '',
    status: 'planning',
    progress_percent: 0,
  })
  const [editLoading, setEditLoading] = useState(false)

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const projectsWithMembers = await Promise.all(
          data.map(async (p: any) => {
            const members = await getProjectMembers(p.id)
            return { ...p, members }
          })
        )
        setProjects(projectsWithMembers)
      }
    } catch (err) {
      console.error('Error loading projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadProjects()
  }, [user])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const { error } = await supabase.from('projects').insert({
        ...createForm,
        created_by: user?.id,
        status: 'planning',
        progress_percent: 0,
        tech_stack: createForm.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
      })
      if (error) throw error
      
      setShowCreateModal(false)
      setCreateForm({ title: '', description: '', tech_stack: '', repo_url: '', demo_url: '' })
      await loadProjects()
    } catch (err: any) {
      alert(err.message || 'Failed to create project')
    } finally {
      setCreateLoading(false)
    }
  }

  const openMemberModal = async (project: Project) => {
    setMemberModalProject(project)
    setLoadingMembers(true)
    setSelectedInternId('')
    try {
      const available = await getAvailableInternsForProject(project.id)
      setAvailableInterns(available)
    } catch (err) {
      console.error('Failed to load available interns:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleAddMember = async () => {
    if (!memberModalProject || !selectedInternId) return
    setMemberActionLoading(true)
    try {
      const res = await addProjectMember(memberModalProject.id, selectedInternId)
      if (res.success) {
        await loadProjects()
        const updatedMembers = await getProjectMembers(memberModalProject.id)
        const available = await getAvailableInternsForProject(memberModalProject.id)
        setMemberModalProject(prev => prev ? { ...prev, members: updatedMembers } : null)
        setAvailableInterns(available)
        setSelectedInternId('')
      } else {
        alert(res.error || 'Failed to add member')
      }
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred')
    } finally {
      setMemberActionLoading(false)
    }
  }

  const handleRemoveMember = async (internId: string) => {
    if (!memberModalProject) return
    if (!confirm('Are you sure you want to remove this member from the project?')) return
    setMemberActionLoading(true)
    try {
      const res = await removeProjectMember(memberModalProject.id, internId)
      if (res.success) {
        await loadProjects()
        const updatedMembers = await getProjectMembers(memberModalProject.id)
        const available = await getAvailableInternsForProject(memberModalProject.id)
        setMemberModalProject(prev => prev ? { ...prev, members: updatedMembers } : null)
        setAvailableInterns(available)
      } else {
        alert(res.error || 'Failed to remove member')
      }
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred')
    } finally {
      setMemberActionLoading(false)
    }
  }

  const openEditModal = (project: Project) => {
    setEditModalProject(project)
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      tech_stack: project.tech_stack?.join(', ') || '',
      repo_url: project.repo_url || '',
      demo_url: project.demo_url || '',
      status: project.status || 'planning',
      progress_percent: project.progress_percent || 0,
    })
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalProject) return
    setEditLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editForm.title,
          description: editForm.description,
          tech_stack: editForm.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
          repo_url: editForm.repo_url,
          demo_url: editForm.demo_url,
          status: editForm.status,
          progress_percent: Number(editForm.progress_percent),
        })
        .eq('id', editModalProject.id)

      if (error) throw error

      setEditModalProject(null)
      await loadProjects()
    } catch (err: any) {
      alert(err.message || 'Failed to update project')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="text-indigo-600" size={24} />
            Projects
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage intern projects, view assignments, and track development progress.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-sm hover:shadow"
        >
          <Plus size={18} /> Create Project
        </button>
      </div>

      {loadingProjects ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-sm text-slate-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto mt-10">
          <FolderKanban className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-800">No Projects Found</h3>
          <p className="text-sm text-slate-500 mt-1">Get started by creating your first team project.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition duration-200"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Created {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      p.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : p.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : p.status === 'on_hold'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {p.description || <span className="italic text-slate-400">No description provided.</span>}
                </p>

                {p.tech_stack && p.tech_stack.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {p.tech_stack.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1.5 pt-1">
                  {p.repo_url && (
                    <a
                      href={p.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium self-start"
                    >
                      <Link size={14} />
                      GitHub Repository
                    </a>
                  )}
                  {p.demo_url && (
                    <a
                      href={p.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium self-start"
                    >
                      <ExternalLink size={14} />
                      Project Files & Resource Link
                    </a>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-slate-900">{p.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${p.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Interns section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Members</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    {p.members && p.members.length > 0 ? (
                      p.members.map((m) => (
                        <div
                          key={m.id}
                          className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 transition duration-150"
                          title={`${m.email} (${m.source})`}
                        >
                          <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px]">
                            {m.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{m.full_name}</span>
                          <span className="text-[9px] text-slate-400 font-normal">({m.source})</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs italic text-slate-400">No interns assigned to this project yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => openMemberModal(p)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition duration-150"
                >
                  <Users size={14} />
                  Manage Members
                </button>
                <button
                  onClick={() => openEditModal(p)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition duration-150"
                >
                  <Edit2 size={14} />
                  Edit Project
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-lg mx-4 z-10 transition duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-950">Create New Project</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                <input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Intern Portal Redesign"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Provide a detailed description of project objectives..."
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tech Stack</label>
                <input
                  value={createForm.tech_stack}
                  onChange={(e) => setCreateForm({ ...createForm, tech_stack: e.target.value })}
                  placeholder="Next.js, Tailwind CSS, TypeScript (comma-separated)"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GitHub Repo URL</label>
                <input
                  value={createForm.repo_url}
                  onChange={(e) => setCreateForm({ ...createForm, repo_url: e.target.value })}
                  placeholder="https://github.com/org/repo"
                  type="url"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Files & Resource URL</label>
                <input
                  value={createForm.demo_url}
                  onChange={(e) => setCreateForm({ ...createForm, demo_url: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/... or Figma link"
                  type="url"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition duration-150 flex items-center gap-1.5"
                >
                  {createLoading && <Loader2 className="animate-spin" size={14} />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {memberModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMemberModalProject(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-lg mx-4 z-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Manage Members</h3>
                <p className="text-xs text-slate-500 mt-0.5">{memberModalProject.title}</p>
              </div>
              <button onClick={() => setMemberModalProject(null)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>

            {loadingMembers ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
                <p className="text-xs text-slate-500">Loading assignments...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Assigned members list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Interns ({memberModalProject.members?.length || 0})</h4>
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
                    {memberModalProject.members && memberModalProject.members.length > 0 ? (
                      memberModalProject.members.map((member) => {
                        const isGroupOnly = member.source && member.source.includes('Group:') && !member.source.includes('Direct');
                        const isBoth = member.source && member.source.includes('Direct') && member.source.includes('Group:');
                        
                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-white">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                {member.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-semibold text-slate-900">{member.full_name}</p>
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50">
                                    {member.source}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500">{member.email}</p>
                              </div>
                            </div>
                            {isGroupOnly ? (
                              <span 
                                className="text-[10px] text-slate-400 italic px-2 py-1"
                                title="Manage this intern's assignment in the Groups section"
                              >
                                Assigned via Group
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={memberActionLoading}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
                                title={isBoth ? "Remove direct assignment (will remain in group)" : "Remove from project"}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-4 text-center text-xs italic text-slate-400 bg-white rounded-xl">
                        No interns currently assigned.
                      </div>
                    )}
                  </div>
                </div>

                {/* Add new member form */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Intern</h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedInternId}
                      onChange={(e) => setSelectedInternId(e.target.value)}
                      disabled={memberActionLoading || availableInterns.length === 0}
                      className="flex-1 px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {availableInterns.length === 0
                          ? 'No active interns available to assign'
                          : 'Select an intern...'}
                      </option>
                      {availableInterns.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.full_name} ({i.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={memberActionLoading || !selectedInternId}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition duration-150 flex items-center gap-1.5 shadow-sm"
                    >
                      {memberActionLoading && <Loader2 className="animate-spin" size={14} />}
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditModalProject(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-lg mx-4 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-950">Edit Project Details</h3>
              <button onClick={() => setEditModalProject(null)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Progress ({editForm.progress_percent}%)</label>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editForm.progress_percent}
                      onChange={(e) => setEditForm({ ...editForm, progress_percent: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tech Stack</label>
                <input
                  value={editForm.tech_stack}
                  onChange={(e) => setEditForm({ ...editForm, tech_stack: e.target.value })}
                  placeholder="React, Postgres, Supabase (comma-separated)"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GitHub Repo URL</label>
                <input
                  value={editForm.repo_url}
                  onChange={(e) => setEditForm({ ...editForm, repo_url: e.target.value })}
                  type="url"
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Files & Resource URL</label>
                <input
                  value={editForm.demo_url}
                  onChange={(e) => setEditForm({ ...editForm, demo_url: e.target.value })}
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/... or Figma link"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalProject(null)}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition duration-150 flex items-center gap-1.5"
                >
                  {editLoading && <Loader2 className="animate-spin" size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
