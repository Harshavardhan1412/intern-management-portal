'use client'

import { Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp } from 'lucide-react'

interface AdminStats {
  totalInterns: number
  presentToday: number
  absentToday: number
  lateToday: number
  missingCheckOuts: number
  avgAttendancePercent: number
}

export default function AdminAttendanceCards({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
          <Users size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Interns</p>
          <p className="text-xl font-semibold text-slate-900">{stats.totalInterns}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <UserCheck size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Present Today</p>
          <p className="text-xl font-semibold text-slate-900">{stats.presentToday}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
          <UserX size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Absent Today</p>
          <p className="text-xl font-semibold text-slate-900">{stats.absentToday}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
          <Clock size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Late Arrivals</p>
          <p className="text-xl font-semibold text-slate-900">{stats.lateToday}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Missing Check-outs</p>
          <p className="text-xl font-semibold text-slate-900">{stats.missingCheckOuts}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Avg Attendance</p>
          <p className="text-xl font-semibold text-slate-900">{stats.avgAttendancePercent}%</p>
        </div>
      </div>
    </div>
  )
}
