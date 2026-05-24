'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Users } from 'lucide-react'

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('interns').select('id, group_id').eq('user_id', user.id).single().then(({ data: intern }) => {
      if (!intern) return
      supabase.from('groups').select('*').eq('id', intern.group_id).then(({ data }) => {
        if (data) setGroups(data)
      })
    })
  }, [user])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">My Groups</h2>
      {groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={48} className="mx-auto mb-3 text-slate-300" />
          <p>Not assigned to any group yet</p>
        </div>
      ) : groups.map((g) => (
        <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-100"><Users size={20} className="text-purple-600" /></div>
          <div>
            <h3 className="font-semibold text-slate-900">{g.name}</h3>
            <p className="text-sm text-slate-500">{g.description || 'No description'}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
