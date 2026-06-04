'use client'

import { Clock, Calendar, CheckCircle, XCircle, TrendingUp, Briefcase } from 'lucide-react'

interface AttendanceStats {
  presentDays: number
  absentDays: number
  totalDays: number
  weeklyPercent: number
  currentStreak: number
  leaveBalance: number
  hoursWorkedWeek: number
  todayStatus: string
}

export default function AttendanceCards({ stats }: { stats: AttendanceStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
          <Clock size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Today's Status</p>
          <p className="text-lg font-semibold text-slate-900 capitalize">{stats.todayStatus || 'Pending'}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          <Calendar size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Working Days</p>
          <p className="text-lg font-semibold text-slate-900">{stats.totalDays}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Present Days</p>
          <p className="text-lg font-semibold text-slate-900">{stats.presentDays}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
          <XCircle size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Absent Days</p>
          <p className="text-lg font-semibold text-slate-900">{stats.absentDays}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Weekly Att. %</p>
          <p className="text-lg font-semibold text-slate-900">{stats.weeklyPercent}%</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
          <Briefcase size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Streak</p>
          <p className="text-lg font-semibold text-slate-900">{stats.currentStreak} Days</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
          <Calendar size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Leave Balance</p>
          <p className="text-lg font-semibold text-slate-900">{stats.leaveBalance}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
          <Clock size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hours This Week</p>
          <p className="text-lg font-semibold text-slate-900">{stats.hoursWorkedWeek}h</p>
        </div>
      </div>
    </div>
  )
}
