'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Search, UserCheck, UserX, Trash2, Edit2 } from 'lucide-react'
import { createIntern, deleteIntern, updateIntern } from '@/actions/interns'

interface InternRow {
  id: string
  user_id: string
  full_name: string
  email: string
  domain: string | null
  college: string | null
  phone: string | null
  status: string
  skills: string[]
  performance_score: number
}

export default function AdminInternsPage() {
  const { user } = useAuth()
  const [interns, setInterns] = useState<InternRow[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', skills: '', college: '', phone: '' })
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editIntern, setEditIntern] = useState<{ id: string, userId: string } | null>(null)
  const [editForm, setEditForm] = useState({ name: '', skills: '', college: '', phone: '' })

  const load = async () => {
    const { data } = await supabase
      .from('interns')
      .select('id, user_id, domain, college, phone, status, skills, performance_score, users:user_id(full_name, email)')
      .order('created_at', { ascending: false })

    if (data) {
      setInterns(data.map((i: any) => ({
        id: i.id,
        user_id: i.user_id,
        full_name: i.users?.full_name ?? '',
        email: i.users?.email ?? '',
        domain: i.domain,
        college: i.college,
        phone: i.phone,
        status: i.status,
        skills: i.skills ?? [],
        performance_score: i.performance_score,
      })))
    }
  }

  useEffect(() => { load() }, [])

  const filtered = interns.filter((i) =>
    i.full_name.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await createIntern({
      name: form.name,
      email: form.email,
      password: form.email,
      domain: '',
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      college: form.college,
      phone: form.phone,
    })

    if (!result.success) {
      setError(result.error ?? 'Failed to create intern')
      setLoading(false)
      return
    }

    setForm({ name: '', email: '', skills: '', college: '', phone: '' })
    setShowModal(false)
    setLoading(false)
    load()
  }

  const handleDelete = async (id: string, userId: string) => {
    if (!confirm('Are you sure you want to delete this intern? This will also remove all their associated data.')) return;
    await deleteIntern(userId, id)
    load()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editIntern) return

    setLoading(true)
    setError('')

    const result = await updateIntern(editIntern.userId, editIntern.id, {
      name: editForm.name,
      skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      college: editForm.college,
      phone: editForm.phone,
    })

    if (!result.success) {
      setError(result.error ?? 'Failed to update intern')
      setLoading(false)
      return
    }

    setShowEditModal(false)
    setEditIntern(null)
    setLoading(false)
    load()
  }

  const openEditModal = (intern: InternRow) => {
    setEditIntern({ id: intern.id, userId: intern.user_id })
    setEditForm({
      name: intern.full_name,
      skills: intern.skills.join(', '),
      college: intern.college || '',
      phone: intern.phone || ''
    })
    setError('')
    setShowEditModal(true)
  }

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'terminated' : 'active'
    await supabase.from('interns').update({ status: newStatus }).eq('id', id)
    load()
  }

  if (user?.role !== 'admin') {
    return <div className="flex-1 overflow-y-auto p-6"><div className="bg-white rounded-xl border p-12 text-center"><h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2><p className="text-slate-500">Only administrators can manage interns.</p></div></div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Intern Management</h2><p className="text-sm text-slate-500">{interns.length} total</p></div>
          <button onClick={() => { setForm({ name: '', email: '', skills: '', college: '', phone: '' }); setError(''); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Add Intern
        </button>
      </div>

      <div className="relative max-w-md"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50">
            <th className="text-left px-3 py-3 font-medium text-slate-600">Name</th>
            <th className="text-left px-3 py-3 font-medium text-slate-600">Email</th>
            <th className="text-left px-3 py-3 font-medium text-slate-600">College</th>
            <th className="text-left px-3 py-3 font-medium text-slate-600">Phone</th>
            <th className="text-left px-3 py-3 font-medium text-slate-600">Skills</th>
            <th className="text-left px-3 py-3 font-medium text-slate-600">Score</th>
            <th className="text-left px-3 py-3 font-medium text-slate-600">Status</th>
            <th className="text-right px-3 py-3 font-medium text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
              {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-12 text-center text-slate-400">No interns found</td></tr>
            ) : filtered.map((intern) => (
              <tr key={intern.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                      {intern.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium text-slate-900">{intern.full_name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-600 text-xs">{intern.email}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{intern.college || '—'}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{intern.phone || '—'}</td>
                <td className="px-3 py-3"><div className="flex gap-1 flex-wrap">{(intern.skills ?? []).slice(0, 2).map(s => <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{s}</span>)}{(intern.skills?.length ?? 0) > 2 && <span className="text-xs text-slate-400">+{intern.skills.length - 2}</span>}</div></td>
                <td className="px-3 py-3"><span className={`text-sm font-medium ${intern.performance_score >= 80 ? 'text-emerald-600' : intern.performance_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{intern.performance_score}</span></td>
                <td className="px-3 py-3"><span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${intern.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{intern.status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />}{intern.status}</span></td>
                <td className="px-3 py-3 text-right"><div className="flex justify-end gap-1">
                  <button onClick={() => toggleStatus(intern.id, intern.status)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600">{intern.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                  <button onClick={() => openEditModal(intern)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(intern.id, intern.user_id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowModal(false); setError('') }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add New Intern</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Riya Singh" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. riya@incuxai.com" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">College</label>
                  <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="e.g. IIT Bombay" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98765 43210" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
                <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. React, TypeScript, Node.js" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <p className="text-xs text-slate-400">Default password: <strong>their email address</strong></p>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError('') }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Intern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowEditModal(false); setError('') }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Intern</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">College</label>
                  <input value={editForm.college} onChange={(e) => setEditForm({ ...editForm, college: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
                <input value={editForm.skills} onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditModal(false); setError('') }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
