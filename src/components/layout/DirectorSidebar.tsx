'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FolderKanban, ListChecks, Users,
  CalendarOff, Megaphone, Star, LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const navItems = [
  { label: 'Dashboard', href: '/director/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Projects', href: '/director/projects', icon: <FolderKanban size={20} /> },
  { label: 'Tasks', href: '/director/tasks', icon: <ListChecks size={20} /> },
  { label: 'Leave Requests', href: '/director/leaves', icon: <CalendarOff size={20} /> },
  { label: 'Announcements', href: '/director/announcements', icon: <Megaphone size={20} /> },
  { label: 'Evaluations', href: '/director/evaluations', icon: <Star size={20} /> },
]

export default function DirectorSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30 text-white" style={{ backgroundColor: '#0F172A' }}>
      <div className="px-6 py-5 border-b" style={{ borderColor: '#1E293B' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#14B8A6' }}>I</div>
          <div>
            <span className="font-bold text-lg tracking-tight">incuxAI</span>
            <span className="block text-xs text-slate-400 -mt-0.5">Director Panel</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              style={active ? { backgroundColor: '#14B8A6' } : {}}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t" style={{ borderColor: '#1E293B' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#334155' }}>
            {user?.initials ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName ?? '...'}</p>
            <p className="text-xs truncate" style={{ color: '#14B8A6' }}>{user?.role}</p>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-slate-700" style={{ color: '#94A3B8' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

