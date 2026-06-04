'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

export default function AttendanceHistoryTable({ records }: { records: any[] }) {
  const [filter, setFilter] = useState('all') // 'all', 'weekly', 'monthly'

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true
    const recordDate = new Date(record.date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - recordDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    if (filter === 'weekly') return diffDays <= 7
    if (filter === 'monthly') return diffDays <= 30
    return true
  })

  const handleExport = () => {
    window.location.href = `/api/attendance/export/excel?period=${filter === 'all' ? 'monthly' : filter}`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Attendance History</h3>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 sm:flex-none border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="all">All Time</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Hours Worked</th>
              <th className="px-4 py-3">Tasks Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No records found for the selected period.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{record.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium capitalize
                      ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${record.status === 'late' ? 'bg-amber-100 text-amber-700' : ''}
                      ${record.status === 'absent' ? 'bg-red-100 text-red-700' : ''}
                      ${record.status === 'leave' ? 'bg-purple-100 text-purple-700' : ''}
                    `}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                  </td>
                  <td className="px-4 py-3">
                    {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {record.total_hours ? `${record.total_hours}h` : '--'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {record.tasks_submitted || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
