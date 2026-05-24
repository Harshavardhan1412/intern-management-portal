'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, Users } from 'lucide-react'

export default function AdminGroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadGroups()
  }, [user])

  const loadGroups = async () => {
    const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
    if (data) {
      const withCounts = await Promise.all(data.map(async (g) => {
        const { count } = await supabase.from('interns').select('*', { count: 'exact' }).eq('group_id', g.id)
        return { ...g, member_count: count ?? 0 }
      }))
      setGroups(withCounts)
    }
  }

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('groups').insert(form)
    setShowModal(false)
    setForm({ name: '', description: '' })
    loadGroups()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Groups</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          <Plus size={18} /> Create Group
        </button>
      </div>

      {groups.map((g) => (
        <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-100"><Users size={20} className="text-purple-600" /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{g.name}</h3>
            <p className="text-sm text-slate-500">{g.member_count} members · {g.description || 'No description'}</p>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-slate-900 mb-4">Create Group</h3>
            <form onSubmit={createGroup} className="space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
