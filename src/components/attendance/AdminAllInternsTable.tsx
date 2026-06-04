'use client'

import { useState } from 'react'
import { Search, Download, Filter, Eye, MapPin, X } from 'lucide-react'

export default function AdminAllInternsTable({ 
  records, 
  onExport, 
  onEdit 
}: { 
  records: any[]
  onExport: (period: string) => void
  onEdit: (record: any) => void 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string; lat?: number; lng?: number; time?: string } | null>(null)

  const filteredRecords = records.filter(record => {
    const nameMatch = record.interns?.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const emailMatch = record.interns?.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const teamMatch = teamFilter === 'all' || record.interns?.groups?.name === teamFilter
    return (nameMatch || emailMatch) && teamMatch
  })

  // Get unique teams for the filter dropdown
  const teams = Array.from(new Set(records.map(r => r.interns?.groups?.name).filter(Boolean))) as string[]

  const handleViewPhoto = (record: any) => {
    setSelectedPhoto({
      url: record.selfie_url,
      name: record.interns?.users?.full_name || 'Intern',
      lat: record.latitude,
      lng: record.longitude,
      time: record.check_in_time ? new Date(record.check_in_time).toLocaleString() : undefined
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-900">All Interns Attendance</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search intern..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          
          <select 
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          
          <button 
            onClick={() => onExport('weekly')}
            className="flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-light px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0">
            <tr>
              <th className="px-4 py-3">Intern Name</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Hours Worked</th>
              <th className="px-4 py-3">Tasks</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{record.interns?.users?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{record.interns?.users?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{record.interns?.groups?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium capitalize
                      ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${record.status === 'late' ? 'bg-amber-100 text-amber-700' : ''}
                      ${record.status === 'absent' ? 'bg-red-100 text-red-700' : ''}
                      ${record.status === 'leave' ? 'bg-purple-100 text-purple-700' : ''}
                      ${record.status === 'Pending' ? 'bg-slate-100 text-slate-600' : ''}
                    `}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {record.selfie_url ? (
                      <button 
                        onClick={() => handleViewPhoto(record)}
                        className="relative group focus:outline-none flex items-center"
                      >
                        <img 
                          src={record.selfie_url} 
                          alt="Selfie" 
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 transition-transform duration-200 group-hover:scale-105 group-hover:border-brand shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye size={14} />
                        </div>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">--</span>
                    )}
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
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => onEdit(record)}
                      className="text-brand hover:text-brand-light text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lightbox / Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedPhoto(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full z-10 border border-slate-100 dark:border-slate-800 animate-scale-in">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Check-in Verification</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedPhoto.name}</p>
              </div>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center">
                <img 
                  src={selectedPhoto.url} 
                  alt="Stamped Selfie" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Stamped Info Details */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800/80">
                {selectedPhoto.time && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-400">Captured At</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPhoto.time}</span>
                  </div>
                )}
                {selectedPhoto.lat && selectedPhoto.lng && (
                  <>
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50 pt-2.5">
                      <span className="font-medium text-slate-400">GPS Coordinates</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {selectedPhoto.lat.toFixed(6)}, {selectedPhoto.lng.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-end pt-1">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedPhoto.lat},${selectedPhoto.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-light hover:underline transition-colors"
                      >
                        <MapPin size={12} />
                        View location on Google Maps
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
