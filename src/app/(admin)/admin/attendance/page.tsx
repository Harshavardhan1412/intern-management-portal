'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ClipboardCheck, Search } from 'lucide-react'

export default function AdminAttendancePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') return
    supabase.from('attendance').select('*, intern:intern_id(id, user_id, users:user_id(full_name))').order('date', { ascending: false }).limit(50).then(({ data }) => {
      if (data) setRecords(data)
    })
  }, [user])

  const filtered = records.filter((r) =>
    r.intern?.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Attendance Records</h2>
      <div className="relative max-w-md"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50">
            <th className="text-left px-4 py-3 font-medium text-slate-600">Intern</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Check In</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Check Out</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Verified</th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.intern?.users?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{r.date}</td>
                <td className="px-4 py-3 text-slate-600">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  r.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                  r.status === 'late' ? 'bg-amber-100 text-amber-700' :
                  r.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>{r.status}</span></td>
                <td className="px-4 py-3">{r.is_verified ? <ClipboardCheck size={16} className="text-emerald-500" /> : <span className="text-slate-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
