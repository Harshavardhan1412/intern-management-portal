'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Plus, CheckCircle, XCircle, ExternalLink, FileText, Search } from 'lucide-react'

export default function AdminTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [interns, setInterns] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
  
  const [reviewModal, setReviewModal] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadTasks()
    Promise.all([
      supabase.from('interns').select('id, user_id').eq('status', 'active'),
      supabase.from('users').select('id, full_name'),
    ]).then(([internsRes, usersRes]) => {
      if (!internsRes.data || !usersRes.data) return
      const userMap = Object.fromEntries(usersRes.data.map((u: any) => [u.id, u.full_name]))
      setInterns(internsRes.data.map((i: any) => ({ id: i.id, full_name: userMap[i.user_id] ?? '?' })))
    })
  }, [user])

  const loadTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*, intern:assigned_to(id, users:user_id(full_name))').order('created_at', { ascending: false })
    if (error) console.error('load tasks error:', error)
    if (data) setTasks(data)
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...form, created_by: user?.id, status: 'pending' }
    if (!payload.assigned_to) delete payload.assigned_to
    const { error } = await supabase.from('tasks').insert(payload)
    if (error) { alert('Failed to create: ' + error.message); return }
    setShowModal(false)
    setForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
    loadTasks()
  }

  const submitReview = async (id: string, status: 'approved' | 'rejected') => {
    setSubmitting(true)
    const { error } = await supabase.from('tasks').update({ 
      status, 
      mentor_feedback: feedback,
      approved_at: status === 'approved' ? new Date().toISOString() : null 
    }).eq('id', id)
    
    setSubmitting(false)
    if (error) { alert('Review failed: ' + error.message); return }
    
    setReviewModal(null)
    setFeedback('')
    loadTasks()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Task Management</h2>
          <p className="text-sm text-slate-500 mt-1">Assign work and verify intern submissions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-light transition-colors shadow-sm">
          <Plus size={18} /> Create Task
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate text-lg">{t.title}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-medium text-slate-700">
                  {t.intern?.users?.full_name ?? 'Unassigned'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500">
                  Due {new Date(t.due_date).toLocaleDateString()}
                </span>
                <span className="text-slate-300">•</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  t.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {t.priority}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                t.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                t.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>{t.status.replace('_', ' ')}</span>
              
              {t.status === 'submitted' && (
                <button 
                  onClick={() => { setReviewModal(t); setFeedback(t.mentor_feedback || '') }} 
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Search size={14} /> Review Submission
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-auto shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Verify Submission</h3>
            <p className="text-sm text-slate-500 mb-6">Review the work submitted by the intern</p>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-slate-900">{reviewModal.title}</h4>
                {reviewModal.description && <p className="text-sm text-slate-600 mt-1">{reviewModal.description}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Intern's Note</label>
                <div className="text-sm text-slate-700 bg-white border border-slate-200 p-3 rounded-xl min-h-[60px]">
                  {reviewModal.submission_note || <span className="text-slate-400 italic">No notes provided</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attachment / Link</label>
                {reviewModal.submission_url ? (
                  <a href={reviewModal.submission_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand hover:text-brand-light font-medium bg-brand/5 border border-brand/20 p-3 rounded-xl transition-colors">
                    <ExternalLink size={16} /> View Submission File
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-400 p-3 border border-slate-200 rounded-xl border-dashed">
                    <FileText size={16} /> No file attached
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mentor Feedback</label>
                <textarea 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)} 
                  placeholder="Provide constructive feedback (required for rejection)..." 
                  rows={3} 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand bg-white hover:bg-slate-50 transition-colors" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setReviewModal(null)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button 
                  onClick={() => submitReview(reviewModal.id, 'rejected')} 
                  disabled={submitting || !feedback.trim()} 
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={16} /> Needs Work
                </button>
                <button 
                  onClick={() => submitReview(reviewModal.id, 'approved')} 
                  disabled={submitting} 
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-auto shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Create New Task</h3>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-slate-50 hover:bg-white transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add more details..." rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-slate-50 hover:bg-white transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-slate-50 hover:bg-white transition-colors">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-slate-50 hover:bg-white transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assignee</label>
                <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 bg-slate-50 hover:bg-white transition-colors">
                  <option value="" disabled>Select an intern...</option>
                  {interns.map((i: any) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-light transition-colors shadow-sm">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
