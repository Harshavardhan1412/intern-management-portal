'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CheckCircle, XCircle, Search, Clock } from 'lucide-react'

export default function DirectorLeaves() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const load = () => {
    let query = supabase
      .from('leave_requests')
      .select('*, interns!inner(id, user_id, users:user_id(full_name, email))')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    query.then(({ data }) => {
      if (data) setLeaves(data)
    })
  }

  useEffect(() => { load() }, [filter])

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('leave_requests').update({ status, admin_id: user?.id, actioned_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>Leave Requests</h2>
      </div>

      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'text-white' : ''}`}
            style={filter === f ? { backgroundColor: '#14B8A6' } : { backgroundColor: '#F1F5F9', color: '#64748B' }}
          >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <div className="space-y-3">
        {leaves.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#94A3B8' }}>No leave requests found</div>
        ) : leaves.map((l) => (
          <div key={l.id} className="bg-white rounded-xl border p-5" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium" style={{ color: '#0F172A' }}>{l.interns?.users?.full_name || 'Unknown'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                    backgroundColor: l.status === 'pending' ? '#FEF3C7' : l.status === 'approved' ? '#D1FAE5' : '#FEE2E2',
                    color: l.status === 'pending' ? '#92400E' : l.status === 'approved' ? '#065F46' : '#991B1B',
                  }}>{l.status}</span>
                </div>
                <p className="text-sm" style={{ color: '#64748B' }}>{l.reason}</p>
                <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#94A3B8' }}>
                  <span className="capitalize">{l.leave_type}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</span>
                </div>
              </div>
              {l.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAction(l.id, 'approved')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors" style={{ backgroundColor: '#10B981' }}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button onClick={() => handleAction(l.id, 'rejected')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors" style={{ backgroundColor: '#EF4444' }}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
