'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AdminAttendanceCards from '@/components/attendance/AdminAttendanceCards'
import AdminAllInternsTable from '@/components/attendance/AdminAllInternsTable'
import { AlertCircle, Plus, Bell } from 'lucide-react'
import { addAttendance } from '@/actions/attendance'
import { sendReminder } from '@/actions/notifications'

export default function AdminAttendancePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'missing_in' | 'missing_out'>('all')

  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [remindingId, setRemindingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    intern_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in_time: '09:00',
    check_out_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    status: 'present',
    is_verified: true,
    has_existing_check_in: false,
  })

  const handleEdit = (record: any) => {
    setError('')
    
    const getLocalTime = (isoString: string | null) => {
      if (!isoString) return ''
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    setForm({
      intern_id: record.id,
      date: new Date().toISOString().split('T')[0],
      check_in_time: getLocalTime(record.check_in_time) || '09:00',
      check_out_time: getLocalTime(record.check_out_time) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: record.status === 'Pending' ? 'present' : record.status,
      is_verified: true,
      has_existing_check_in: !!record.check_in_time,
    })
    setShowModal(true)
  }

  const handleAddClick = () => {
    setError('')
    setForm({
      intern_id: '',
      date: new Date().toISOString().split('T')[0],
      check_in_time: '09:00',
      check_out_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'present',
      is_verified: true,
      has_existing_check_in: false,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const checkInDateTime = form.check_in_time ? new Date(`${form.date}T${form.check_in_time}`).toISOString() : null;
      const checkOutDateTime = form.check_out_time ? new Date(`${form.date}T${form.check_out_time}`).toISOString() : null;

      const result = await addAttendance({
        intern_id: form.intern_id,
        date: form.date,
        check_in_time: checkInDateTime,
        check_out_time: checkOutDateTime,
        status: form.status,
        is_verified: form.is_verified,
      })

      if (!result.success) throw new Error(result.error || 'Failed to add attendance')

      setShowModal(false)
      setForm({ ...form, intern_id: '' })
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to add attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const loadData = async () => {
    if (user?.role !== 'admin') return
    setLoading(true)

    try {
      const res = await fetch('/api/admin/attendance/all')
      if (res.ok) {
        const json = await res.json()
        setRecords(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    }
  }, [user])

  const handleExport = (period: string) => {
    window.location.href = `/api/attendance/export/excel?period=${period}`
  }

  const handleRemind = async (userId: string, type: 'checkin' | 'checkout') => {
    setRemindingId(userId)
    const title = type === 'checkin' ? 'Missing Check-In' : 'Missing Check-Out'
    const body = type === 'checkin' 
      ? 'Please check in for today. The expected check-in time is 09:00 AM.' 
      : 'You have not checked out yet. Please remember to check out to complete your shift.'
    
    await sendReminder(userId, title, body)
    
    setTimeout(() => {
      setRemindingId(null)
      alert('Reminder sent successfully!')
    }, 500)
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading attendance data...</div>
  }

  const totalInterns = new Set(records.map(r => r.id)).size
  const presentToday = records.filter(r => r.status === 'present').length
  const lateToday = records.filter(r => r.status === 'late').length
  const absentToday = records.filter(r => r.status === 'absent').length
  
  const missingCheckOutsList = records.filter(r => (r.status === 'present' || r.status === 'late' || r.status === 'half_day') && !r.check_out_time)
  const missingCheckInsList = records.filter(r => r.status === 'Pending')
  
  const stats = {
    totalInterns,
    presentToday,
    absentToday,
    lateToday,
    missingCheckOuts: missingCheckOutsList.length,
    avgAttendancePercent: totalInterns > 0 ? Math.round(((presentToday + lateToday) / totalInterns) * 100) : 0
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Attendance Management</h2>
            <p className="text-slate-500 text-sm mt-1">Monitor daily check-ins, manage reports, and view team analytics.</p>
          </div>
          <button 
            onClick={handleAddClick} 
            className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-light transition-colors"
          >
            <Plus size={18} /> Add Attendance
          </button>
        </div>

        <AdminAttendanceCards stats={stats} />

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            All Interns
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reports' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Reports
          </button>
          <button 
            onClick={() => setActiveTab('missing_in')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'missing_in' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Missing Check-ins
            {missingCheckInsList.length > 0 && (
              <span className="bg-amber-100 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{missingCheckInsList.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('missing_out')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'missing_out' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Missing Check-outs
            {stats.missingCheckOuts > 0 && (
              <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{stats.missingCheckOuts}</span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'all' && (
          <div className="w-full">
            <AdminAllInternsTable records={records} onExport={handleExport} onEdit={handleEdit} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-100 bg-slate-50 p-6 rounded-xl text-center">
                <h4 className="font-semibold text-slate-800 mb-2">Weekly Report</h4>
                <p className="text-sm text-slate-500 mb-6">Download the attendance data for the last 7 days.</p>
                <button 
                  onClick={() => handleExport('weekly')}
                  className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-light transition-colors"
                >
                  Download Weekly CSV
                </button>
              </div>
              <div className="border border-slate-100 bg-slate-50 p-6 rounded-xl text-center">
                <h4 className="font-semibold text-slate-800 mb-2">Monthly Report</h4>
                <p className="text-sm text-slate-500 mb-6">Download the attendance data for the last 30 days.</p>
                <button 
                  onClick={() => handleExport('monthly')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Download Monthly CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'missing_in' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Missing Check-ins</h3>
                <p className="text-sm text-slate-500">Interns who have not checked in today yet.</p>
              </div>
            </div>

            {missingCheckInsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Everyone has checked in today!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {missingCheckInsList.map(record => (
                  <div key={record.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900">{record.interns?.users?.full_name}</p>
                      <p className="text-xs text-slate-500">Not checked in</p>
                    </div>
                    <button 
                      onClick={() => handleRemind(record.interns?.user_id, 'checkin')}
                      disabled={remindingId === record.interns?.user_id}
                      className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {remindingId === record.interns?.user_id ? 'Sending...' : 'Send Reminder'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'missing_out' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Missing Check-outs</h3>
                <p className="text-sm text-slate-500">Interns who checked in but haven't checked out today.</p>
              </div>
            </div>

            {missingCheckOutsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                All checked-in interns have checked out successfully!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {missingCheckOutsList.map(record => (
                  <div key={record.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900">{record.interns?.users?.full_name}</p>
                      <p className="text-xs text-slate-500">Checked in at {new Date(record.check_in_time).toLocaleTimeString()}</p>
                    </div>
                    <button 
                      onClick={() => handleRemind(record.interns?.user_id, 'checkout')}
                      disabled={remindingId === record.interns?.user_id}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {remindingId === record.interns?.user_id ? 'Sending...' : 'Send Reminder'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Manual Attendance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Intern</label>
                <select required value={form.intern_id} onChange={e => setForm({...form, intern_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-white">
                  <option value="" disabled>Select an intern</option>
                  {records.map(r => (
                    <option key={r.id} value={r.id}>{r.interns?.users?.full_name || 'Unknown'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check In Time</label>
                  <input type="time" disabled={form.has_existing_check_in} value={form.check_in_time} onChange={e => setForm({...form, check_in_time: e.target.value})} className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 ${form.has_existing_check_in ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check Out Time</label>
                  <input type="time" value={form.check_out_time} onChange={e => setForm({...form, check_out_time: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select required value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-white">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_verified} onChange={e => setForm({...form, is_verified: e.target.checked})} className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand" />
                    <span className="text-sm font-medium text-slate-700">Verified</span>
                  </label>
                </div>
              </div>
              
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-light disabled:opacity-50">{submitting ? 'Saving...' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
