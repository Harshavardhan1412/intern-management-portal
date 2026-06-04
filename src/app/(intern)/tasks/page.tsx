'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Clock, CheckCircle2, Circle, Upload, Plus, Edit2, X } from 'lucide-react'

import { createTask, updateTask } from '@/actions/tasks'

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [internId, setInternId] = useState<string | null>(null)
  
  const [submitModal, setSubmitModal] = useState<string | null>(null)
  const [submitNote, setSubmitNote] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium'
  })
  const [loading, setLoading] = useState(false)

  const fetchTasks = async (id: string) => {
    const { data } = await supabase.from('tasks').select('*').eq('assigned_to', id).order('due_date', { ascending: true })
    if (data) setTasks(data)
  }

  useEffect(() => {
    if (!user) return
    supabase.from('interns').select('id').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setInternId(data.id)
        fetchTasks(data.id)
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

  const handleSubmitTask = async () => {
    if (!submitModal || !internId) return
    let fileUrl = ''
    if (submitFile) {
      const path = `task-submissions/${submitModal}/${internId}/${submitFile.name}`
      await supabase.storage.from('task-submissions').upload(path, submitFile)
      const { data: { publicUrl } } = supabase.storage.from('task-submissions').getPublicUrl(path)
      fileUrl = publicUrl
    }
    
    await updateTask(submitModal, {
      status: 'submitted',
      submission_url: fileUrl,
      submission_note: submitNote,
      submitted_at: new Date().toISOString(),
    })
    
    setSubmitModal(null)
    setSubmitNote('')
    setSubmitFile(null)
    fetchTasks(internId)
  }

  const openCreateModal = () => {
    setEditingTask(null)
    setTaskForm({
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'medium'
    })
    setIsTaskModalOpen(true)
  }

  const openEditModal = (task: any) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      due_date: new Date(task.due_date).toISOString().split('T')[0],
      priority: task.priority
    })
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !internId) return
    setLoading(true)

    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      due_date: new Date(taskForm.due_date).toISOString(),
      priority: taskForm.priority,
    }

    if (editingTask) {
      await updateTask(editingTask.id, payload)
    } else {
      await createTask({
        ...payload,
        status: 'pending',
        created_by: user.id,
        assigned_to: internId
      })
    }

    setIsTaskModalOpen(false)
    setLoading(false)
    fetchTasks(internId)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Tasks</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your assigned work and track your progress</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-light transition-colors shadow-sm"
        >
          <Plus size={18} /> Create Task
        </button>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            No tasks found. Click "Create Task" to add your first task!
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="mt-0.5">
                {statusIcon(t.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate text-lg">{t.title}</p>
                {t.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{t.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityColor(t.priority)}`}>
                    {t.priority}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    t.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Due: {new Date(t.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 border-l border-slate-100 pl-5">
                <button 
                  onClick={() => openEditModal(t)} 
                  className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-xl transition-all"
                >
                  <Edit2 size={18} />
                  <span className="text-[10px] font-semibold">Edit</span>
                </button>
                {t.status === 'pending' && (
                  <button 
                    onClick={() => setSubmitModal(t.id)} 
                    className="flex flex-col items-center gap-1 p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Upload size={18} />
                    <span className="text-[10px] font-semibold">Submit</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Task Modal */}
      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSubmitModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-900">Submit Task</h3>
              <button onClick={() => setSubmitModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Attachment (Optional)</label>
                <input type="file" onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Submission Note</label>
                <textarea value={submitNote} onChange={(e) => setSubmitNote(e.target.value)} placeholder="Add a note about your submission..." rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setSubmitModal(null)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={handleSubmitTask} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">Submit Work</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-900">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input required type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="What needs to be done?" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-slate-50 hover:bg-white transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Add more details..." rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-slate-50 hover:bg-white transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input required type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-slate-50 hover:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select required value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-slate-50 hover:bg-white transition-colors">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-light disabled:opacity-50 transition-colors shadow-sm">
                  {loading ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
