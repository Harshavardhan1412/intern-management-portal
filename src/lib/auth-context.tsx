'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { Role } from './types'

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
  avatarUrl: string | null
  initials: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const clearSession = async () => {
    setUser(null)
    setLoading(false)
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  const fetchProfile = async (supabaseUser: User) => {
    const { data } = await supabase
      .from('users')
      .select('full_name, role, avatar_url')
      .eq('id', supabaseUser.id)
      .single()

    const name = data?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User'
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      fullName: name,
      role: (data?.role as Role) ?? 'intern',
      avatarUrl: data?.avatar_url ?? null,
      initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    })
    setLoading(false)
  }

  const refreshUser = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        await fetchProfile(supabaseUser)
      } else {
        setUser(null)
        setLoading(false)
      }
    } catch {
      await clearSession()
    }
  }

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    }).catch(() => { setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
        return
      }
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
      }
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Refresh Token Not Found') ||
          event.reason?.name === 'AuthApiError') {
        event.preventDefault()
        clearSession()
      }
    }
    window.addEventListener('unhandledrejection', handleError)
    return () => window.removeEventListener('unhandledrejection', handleError)
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
