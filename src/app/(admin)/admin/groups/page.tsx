'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Users, X, Edit2, Trash2, Megaphone } from 'lucide-react'
import { saveGroupAction, broadcastGroupNotification } from '@/actions/groups'

interface AvailableIntern {
  id: string
  full_name: string
  email: string
}

interface GroupRow {
  id: string
  name: string
  description: string | null
  project_id?: string | null
  deadline_date?: string | null
  projects?: { title: string } | null
  member_count: number
}

interface ProjectOption {
  id: string
  title: string
}

export default function AdminGroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [availableInterns, setAvailableInterns] = useState<AvailableIntern[]>([])
  const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>([])
  
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editGroupId, setEditGroupId] = useState<string | null>(null)
  
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastGroupId, setBroadcastGroupId] = useState<string | null>(null)
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '' })
  
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>([])
  const [selectedInternId, setSelectedInternId] = useState('')
  const [creating, setCreating] = useState(false)
  const [broadcasting, setBroadcasting] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({ name: '', description: '', project_id: '', deadline_date: '' })

  const getGroups = async () => {
    const { data, error: loadError } = await supabase
      .from('groups')
      .select('*, projects(title)')
      .order('created_at', { ascending: false })
    if (loadError) throw new Error(loadError.message)

    return Promise.all((data ?? []).map(async (group) => {
      const { count } = await supabase.from('interns').select('*', { count: 'exact' }).eq('group_id', group.id)
      return { ...group, member_count: count ?? 0 }
    }))
  }

  const getAvailableProjects = async () => {
    const { data } = await supabase.from('projects').select('id, title').in('status', ['planning', 'active']).order('created_at', { ascending: false })
    return data ?? []
  }

  const getAvailableInterns = async () => {
    const { data, error: loadError } = await supabase
      .from('interns')
      .select('id, group_id, users:user_id(full_name, email)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (loadError) throw new Error(loadError.message)

    return (data ?? []).map((intern: any) => {
      const userObj = Array.isArray(intern.users) ? intern.users[0] : intern.users
      return {
        id: intern.id,
        group_id: intern.group_id,
        full_name: userObj?.full_name ?? 'Unnamed intern',
        email: userObj?.email ?? '',
      }
    })
  }

  const refreshData = async () => {
    try {
      setGroups(await getGroups())
      setAvailableInterns(await getAvailableInterns())
    } catch (loadError) {
      setError('Unable to load data: ' + (loadError as Error).message)
    }
  }

  useEffect(() => {
    if (user?.role !== 'admin') return
    refreshData()
    getAvailableProjects().then(setAvailableProjects).catch(console.error)
  }, [user])

  const openCreateModal = () => {
    setForm({ name: '', description: '', project_id: '', deadline_date: '' })
    setSelectedInternIds([])
    setSelectedInternId('')
    setError('')
    setIsEditing(false)
    setEditGroupId(null)
    setShowModal(true)
  }

  const openEditModal = async (group: GroupRow) => {
    setForm({ 
        name: group.name, 
        description: group.description || '', 
        project_id: group.project_id || '',
        deadline_date: group.deadline_date || ''
    })
    setSelectedInternIds([])
    setSelectedInternId('')
    setError('')
    setIsEditing(true)
    setEditGroupId(group.id)
    setShowModal(true)
    
    // Pre-select interns that already belong to this group
    const memberIds = availableInterns.filter(i => i.group_id === group.id).map(i => i.id)
    setSelectedInternIds(memberIds)
  }
  
  const openBroadcastModal = (groupId: string) => {
    setBroadcastGroupId(groupId)
    setBroadcastForm({ title: '', body: '' })
    setShowBroadcastModal(true)
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? Interns will be unassigned from it.')) return;
    
    await supabase.from('interns').update({ group_id: null }).eq('group_id', id)
    
    const { error: deleteError } = await supabase.from('groups').delete().eq('id', id)
    if (deleteError) {
        setError('Failed to delete group: ' + deleteError.message)
    } else {
        refreshData()
    }
  }

  const addSelectedIntern = () => {
    if (!selectedInternId) return
    setSelectedInternIds((current) => current.includes(selectedInternId) ? current : [...current, selectedInternId])
    setSelectedInternId('')
  }

  const removeSelectedIntern = (internId: string) => {
    setSelectedInternIds((current) => current.filter((id) => id !== internId))
  }

  const saveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (selectedInternIds.length === 0) {
      setError('Select at least one existing employee for this group.')
      return
    }

    setCreating(true)
    setError('')

    const result = await saveGroupAction(
      user.id,
      editGroupId,
      {
        name: form.name,
        description: form.description,
        project_id: form.project_id || null,
        deadline_date: form.deadline_date || null
      },
      selectedInternIds
    )

    if (!result.success) {
      setError('Failed to save group: ' + result.error)
      setCreating(false)
      return
    }

    setShowModal(false)
    setCreating(false)
    refreshData()
  }
  
  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastGroupId) return
    setBroadcasting(true)
    
    const result = await broadcastGroupNotification(broadcastGroupId, broadcastForm.title, broadcastForm.body)
    setBroadcasting(false)
    if (result.success) {
      setShowBroadcastModal(false)
      alert('Announcement sent to all group members!')
    } else {
      alert('Failed to send announcement: ' + result.error)
    }
  }

  const employeesToAdd = availableInterns.filter((intern) => !selectedInternIds.includes(intern.id))
  const selectedEmployees = availableInterns.filter((intern) => selectedInternIds.includes(intern.id))

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Groups</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Create Group
        </button>
      </div>

      {error && !showModal && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {groups.map((g) => (
        <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-100 shrink-0"><Users size={20} className="text-purple-600" /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{g.name}</h3>
            <p className="text-sm text-slate-500">{g.member_count} members · {g.description || 'No description'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {g.projects && (
                  <span className="inline-block text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100 font-medium">
                      Project: {g.projects.title}
                  </span>
              )}
              {g.deadline_date && (
                  <span className="inline-block text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-100 font-medium">
                      Deadline: {g.deadline_date}
                  </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openBroadcastModal(g.id)} title="Send Announcement" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"><Megaphone size={18} /></button>
            <button onClick={() => openEditModal(g)} title="Edit Group" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={18} /></button>
            <button onClick={() => handleDeleteGroup(g.id)} title="Delete Group" className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-slate-900 mb-4">{isEditing ? 'Edit Group' : 'Create Group'}</h3>
            <form onSubmit={saveGroup} className="space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assign Project</label>
                  <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">No project</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Deadline Date</label>
                  <input type="date" value={form.deadline_date} onChange={(e) => setForm({ ...form, deadline_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">Group Members</legend>
                <div className="flex gap-2">
                  <select
                    value={selectedInternId}
                    onChange={(e) => setSelectedInternId(e.target.value)}
                    disabled={employeesToAdd.length === 0}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">{employeesToAdd.length === 0 ? 'No employees available' : 'Select employee...'}</option>
                    {employeesToAdd.map((intern) => (
                      <option key={intern.id} value={intern.id}>{intern.full_name} ({intern.email})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addSelectedIntern}
                    disabled={!selectedInternId}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                {selectedEmployees.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {selectedEmployees.map((intern) => (
                      <div key={intern.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{intern.full_name}</p>
                          <p className="truncate text-xs text-slate-500">{intern.email}</p>
                        </div>
                        <button type="button" onClick={() => removeSelectedIntern(intern.id)} aria-label={`Remove ${intern.full_name}`} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-600 border border-transparent hover:border-slate-200 shadow-sm">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500">{selectedInternIds.length} employee{selectedInternIds.length === 1 ? '' : 's'} selected</p>
              </fieldset>
              
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} disabled={creating} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200">{creating ? 'Saving...' : 'Save Group'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBroadcastModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Megaphone size={18} className="text-indigo-600" /> Announce to Group</h3>
            <form onSubmit={sendBroadcast} className="space-y-4">
              <div>
                 <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                 <input value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} placeholder="E.g. Important Project Update" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                 <textarea value={broadcastForm.body} onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })} placeholder="Type your message here..." rows={4} required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowBroadcastModal(false)} disabled={broadcasting} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={broadcasting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200">{broadcasting ? 'Sending...' : 'Broadcast'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
