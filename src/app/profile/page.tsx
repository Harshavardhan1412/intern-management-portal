'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import {
  Mail, Shield, Building, User, LogOut, Calendar,
  Clock, Users, FileText, ArrowRight, Pencil, X, Check, Lock, Phone,
} from 'lucide-react'
import Link from 'next/link'
import { updateProfile, changePassword } from '@/actions/profile'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ interns: 0, tasks: 0, projects: 0 })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', skills: '', college: '', phone: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    if (!user) return

    if (user.role === 'intern') {
      supabase.from('interns').select('*, users:user_id(full_name, email, avatar_url)').eq('user_id', user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data)
          setEditForm({
            fullName: data.users?.full_name || '',
            skills: (data.skills || []).join(', '),
            college: data.college || '',
            phone: data.phone || '',
          })
        }
      })
    } else {
      supabase.from('users').select('full_name, email, avatar_url, role, created_at').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data)
      })
      Promise.all([
        supabase.from('interns').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
      ]).then(([i, t, p]) => {
        setStats({ interns: i.count ?? 0, tasks: t.count ?? 0, projects: p.count ?? 0 })
      })
    }
  }, [user])

  const roleIcon = user?.role === 'admin' ? <Shield size={16} /> : user?.role === 'director' ? <Building size={16} /> : <User size={16} />
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'director' ? 'Director' : 'Intern'
  const dashboardLink = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'director' ? '/director/dashboard' : '/dashboard'

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setProfileError('')
    const result = await updateProfile({
      userId: user.id,
      fullName: editForm.fullName,
      skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      college: editForm.college,
      phone: editForm.phone,
    })
    if (!result.success) {
      setProfileError(result.error ?? 'Failed to update profile')
      setSaving(false)
      return
    }
    setSaving(false)
    setEditing(false)
    window.location.reload()
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters')
      return
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('Passwords do not match')
      return
    }
    setPwSaving(true)
    const result = await changePassword({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    })
    if (!result.success) {
      setPwError(result.error ?? 'Failed to change password')
      setPwSaving(false)
      return
    }
    setPwSaving(false)
    setPwSuccess(true)
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>My Profile</h2>
        {user?.role === 'intern' && !editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-white" style={{ backgroundColor: '#14B8A6' }}>
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#14B8A6' }}>{user?.initials}</div>
          <div>
            {editing ? (
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="text-lg font-semibold border-b-2 px-1 py-0.5 outline-none"
                style={{ borderColor: '#14B8A6', color: '#0F172A' }}
              />
            ) : (
              <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>{profile?.users?.full_name || profile?.full_name || user?.fullName}</h3>
            )}
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#14B8A6' }}>
              {roleIcon}
              <span className="capitalize">{roleLabel}</span>
              {profile?.domain && <span>· {profile.domain}</span>}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} style={{ color: '#94A3B8' }} />
            <span style={{ color: '#475569' }}>{profile?.users?.email || profile?.email || user?.email}</span>
          </div>
          {profile?.created_at && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} style={{ color: '#94A3B8' }} />
              <span style={{ color: '#475569' }}>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {user?.role === 'intern' && (
          <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: '#F1F5F9' }}>
            {editing ? (
              <>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>College</label>
                  <input value={editForm.college} onChange={(e) => setEditForm({ ...editForm, college: e.target.value })} placeholder="e.g. IIT Bombay" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" style={{ borderColor: '#CBD5E1' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="e.g. +91 98765 43210" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" style={{ borderColor: '#CBD5E1' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Skills (comma-separated)</label>
                  <input value={editForm.skills} onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })} placeholder="e.g. React, TypeScript, Node.js" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" style={{ borderColor: '#CBD5E1' }} />
                </div>
                {profileError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{profileError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50" style={{ backgroundColor: '#14B8A6' }}>
                    <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setProfileError('') }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{ color: '#64748B', backgroundColor: '#F1F5F9' }}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {profile?.college && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building size={16} style={{ color: '#94A3B8' }} />
                    <span style={{ color: '#475569' }}>{profile.college}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} style={{ color: '#94A3B8' }} />
                    <span style={{ color: '#475569' }}>{profile.phone}</span>
                  </div>
                )}
                {profile?.performance_score !== undefined && (
                  <div className="flex items-center gap-3 text-sm">
                    <Shield size={16} style={{ color: '#94A3B8' }} />
                    <span style={{ color: '#475569' }}>Performance Score: {profile.performance_score}/100</span>
                  </div>
                )}
                {profile?.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>Skills</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {profile.skills.map((s: string) => (
                        <span key={s} className="text-xs px-2 py-1 rounded text-white" style={{ backgroundColor: '#14B8A6' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {user?.role !== 'intern' && (
          <div className="mt-5 pt-5 border-t space-y-4" style={{ borderColor: '#F1F5F9' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#64748B' }}>Platform Overview</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-lg font-bold" style={{ color: '#0F172A' }}>{stats.interns}</p>
                <p className="text-xs" style={{ color: '#64748B' }}>Interns</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-lg font-bold" style={{ color: '#0F172A' }}>{stats.tasks}</p>
                <p className="text-xs" style={{ color: '#64748B' }}>Tasks</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-lg font-bold" style={{ color: '#0F172A' }}>{stats.projects}</p>
                <p className="text-xs" style={{ color: '#64748B' }}>Projects</p>
              </div>
            </div>
            <Link
              href={dashboardLink}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#14B8A6' }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} style={{ color: '#64748B' }} />
          <h3 className="font-semibold" style={{ color: '#0F172A' }}>Change Password</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="At least 6 characters"
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              style={{ borderColor: '#CBD5E1' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="Re-enter new password"
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              style={{ borderColor: '#CBD5E1' }}
            />
          </div>
          {pwError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Password changed successfully!</p>}
          <button type="submit" disabled={pwSaving} className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50" style={{ backgroundColor: '#0F172A' }}>
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <button
        onClick={signOut}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-colors text-white"
        style={{ backgroundColor: '#EF4444' }}
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
