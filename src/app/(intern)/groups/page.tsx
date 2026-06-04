'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Users } from 'lucide-react'
import { getInternPortalData } from '@/actions/groups'

export default function GroupsPage() {
  const { user } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getInternPortalData(user.id).then((data) => {
      setGroup(data.group)
      setMembers(data.members)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  if (loading) {
     return <div className="p-6 text-slate-500">Loading your group data...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">My Group</h2>
      {!group ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={48} className="mx-auto mb-3 text-slate-300" />
          <p>Not assigned to any group yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-100"><Users size={20} className="text-purple-600" /></div>
            <div>
              <h3 className="font-semibold text-slate-900">{group.name}</h3>
              <p className="text-sm text-slate-500">{group.description || 'No description'}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {group.projects && (
                <span className="inline-block text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 font-medium">
                    Project: {group.projects.title}
                </span>
            )}
            {group.deadline_date && (
                <span className="inline-block text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100 font-medium">
                    Deadline: {group.deadline_date}
                </span>
            )}
          </div>

          {members.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Group Members</h4>
              <div className="grid gap-2">
                {members.map(m => {
                  const u = Array.isArray(m.users) ? m.users[0] : m.users;
                  return (
                    <div key={m.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {u?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{u?.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{u?.email}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
