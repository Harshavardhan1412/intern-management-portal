'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Clock, CheckCircle2, Circle, Upload } from 'lucide-react'

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [internId, setInternId] = useState<string | null>(null)
  const [submitModal, setSubmitModal] = useState<string | null>(null)
  const [submitNote, setSubmitNote] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('interns').select('id').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setInternId(data.id)
        supabase.from('tasks').select('*').eq('assigned_to', data.id).order('due_date', { ascending: true }).then(({ data: tasks }) => {
          if (tasks) setTasks(tasks)
        })
      }
    })
  }, [user])

  const statusIcon = (s: string) => {
    if (s === 'approved') return <CheckCircle2 size={16} className="text-emerald-500" />
    if (s === 'in_progress' || s === 'submitted') return <Clock size={16} className="text-amber-500" />
    return <Circle size={16} className="text-slate-300" />
  }

  const priorityColor = (p: string) => {
    if (p === 'urgent') return 'bg-red-100 text-red-700'
    if (p === 'high') return 'bg-amber-100 text-amber-700'
    if (p === 'medium') return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-600'
  }

  const handleSubmit = async () => {
    if (!submitModal || !internId) return
    let fileUrl = ''
    if (submitFile) {
      const path = `task-submissions/${submitModal}/${internId}/${submitFile.name}`
      await supabase.storage.from('task-submissions').upload(path, submitFile)
      const { data: { publicUrl } } = supabase.storage.from('task-submissions').getPublicUrl(path)
      fileUrl = publicUrl
    }
    await supabase.from('tasks').update({
      status: 'submitted',
      submission_url: fileUrl,
      submission_note: submitNote,
      submitted_at: new Date().toISOString(),
    }).eq('id', submitModal)
    setSubmitModal(null)
    setSubmitNote('')
    setSubmitFile(null)
    const { data } = await supabase.from('tasks').select('*').eq('assigned_to', internId).order('due_date', { ascending: true })
    if (data) setTasks(data)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">My Tasks</h2>

      {tasks.map((t) => (
        <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          {statusIcon(t.status)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{t.title}</p>
            <p className="text-xs text-slate-500">
              Due {new Date(t.due_date).toLocaleDateString()} · {t.priority}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColor(t.priority)}`}>
            {t.priority}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            t.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
            t.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
            t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {t.status.replace('_', ' ')}
          </span>
          {t.status === 'pending' && (
            <button onClick={() => setSubmitModal(t.id)} className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
              <Upload size={14} /> Submit
            </button>
          )}
        </div>
      ))}

      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSubmitModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="font-semibold text-slate-900">Submit Task</h3>
            <input type="file" onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
            <textarea value={submitNote} onChange={(e) => setSubmitNote(e.target.value)} placeholder="Add a note about your submission..." rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setSubmitModal(null)} className="px-4 py-2 text-sm bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
