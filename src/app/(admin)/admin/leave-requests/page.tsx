'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { CalendarOff, Check, X } from 'lucide-react'
import { updateLeaveStatus } from '@/actions/leave-requests'

export default function AdminLeaveRequestsPage() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaves()
  }, [])

  const fetchLeaves = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('leave_requests')
      .select('*, interns(users(full_name))')
      .order('created_at', { ascending: false })
    
    if (data) setLeaves(data)
    setLoading(false)
  }

  const handleAction = async (id: string, status: string) => {
    await updateLeaveStatus(id, status, user?.id)
    fetchLeaves()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Leave Requests</h2>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading requests...</div>
      ) : leaves.length === 0 ? (
        <div className="text-sm text-slate-500">No leave requests found.</div>
      ) : (
        <div className="space-y-4">
          {leaves.map((l) => (
            <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-slate-100">
                <CalendarOff size={20} className="text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {l.interns?.users?.full_name || 'Unknown Intern'}
                  </p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    l.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  {l.leave_type} Leave • {l.start_date} to {l.end_date}
                </p>
                <p className="text-sm text-slate-700 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {l.reason}
                </p>
              </div>
              
              {l.status === 'pending' && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => handleAction(l.id, 'approved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(l.id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
