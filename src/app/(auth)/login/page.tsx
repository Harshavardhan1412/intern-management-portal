'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Shield, Building, User } from 'lucide-react'

type LoginRole = 'admin' | 'director' | 'intern'

const tabs: { role: LoginRole; label: string; icon: React.ReactNode }[] = [
  { role: 'admin', label: 'Admin', icon: <Shield size={16} /> },
  { role: 'director', label: 'Director', icon: <Building size={16} /> },
  { role: 'intern', label: 'Intern', icon: <User size={16} /> },
]

export default function LoginPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState<LoginRole>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roleInfo: Record<LoginRole, { title: string; desc: string; placeholder: string }> = {
    admin: { title: 'Admin Login', desc: 'Full system access', placeholder: 'admin@incuxai.com' },
    director: { title: 'Director Login', desc: 'Projects & oversight', placeholder: 'director@incuxai.com' },
    intern: { title: 'Intern Login', desc: 'Your daily workspace', placeholder: 'intern@incuxai.com' },
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const target = profile?.role === 'admin' ? '/admin/dashboard'
      : profile?.role === 'director' ? '/director/dashboard'
      : '/dashboard'
    router.replace(target)
  }

  const info = roleInfo[activeRole]

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#14B8A6' }}>I</div>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#0F172A' }}>incuxAI</span>
          </div>

          <div className="flex mb-6 rounded-xl p-1" style={{ backgroundColor: '#F1F5F9' }}>
            {tabs.map((t) => (
              <button
                key={t.role}
                onClick={() => { setActiveRole(t.role); setError('') }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeRole === t.role ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                style={activeRole === t.role ? { color: '#0F172A' } : {}}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>{info.title}</h1>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>{info.desc}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={info.placeholder}
                required
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#CBD5E1' }}
                onFocus={(e) => e.target.style.borderColor = '#14B8A6'}
                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#CBD5E1' }}
                  onFocus={(e) => e.target.style.borderColor = '#14B8A6'}
                  onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-medium py-2.5 rounded-xl disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#14B8A6' }}
            >
              {loading ? 'Signing in...' : `Sign in as ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}`}
            </button>
          </form>

          <p className="text-center text-sm mt-6">
            <Link href="/forgot-password" style={{ color: '#14B8A6' }} className="hover:underline">Forgot password?</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>
        <div className="text-white text-center max-w-md px-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(108,60,225,0.2)' }}>
            <svg className="w-8 h-8" style={{ color: '#14B8A6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-3xl font-bold mb-3">
            {activeRole === 'admin' ? 'Admin Panel' : activeRole === 'director' ? 'Director Portal' : 'Intern Workspace'}
          </h2>
          <p className="text-slate-300">
            {activeRole === 'admin'
              ? 'Create and manage intern accounts, track attendance, assign tasks, and evaluate performance.'
              : activeRole === 'director'
              ? 'Oversee projects, assign tasks, approve leaves, and view intern performance.'
              : 'Track your tasks, mark attendance, manage leaves, and stay connected.'}
          </p>
        </div>
      </div>
    </div>
  )
}

