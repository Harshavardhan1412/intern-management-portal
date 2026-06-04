'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, ClipboardCheck, ListChecks, FolderKanban,
  UserCircle2, Star, Megaphone, BarChart3, LogOut, CalendarOff
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Interns', href: '/admin/interns', icon: <Users size={20} /> },
  { label: 'Attendance', href: '/admin/attendance', icon: <ClipboardCheck size={20} /> },
  { label: 'Leave Requests', href: '/admin/leave-requests', icon: <CalendarOff size={20} /> },
  { label: 'Tasks', href: '/admin/tasks', icon: <ListChecks size={20} /> },
  { label: 'Projects', href: '/admin/projects', icon: <FolderKanban size={20} /> },
  { label: 'Groups', href: '/admin/groups', icon: <UserCircle2 size={20} /> },
  { label: 'Evaluations', href: '/admin/evaluations', icon: <Star size={20} /> },
  { label: 'Announcements', href: '/admin/announcements', icon: <Megaphone size={20} /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-navy text-white flex flex-col z-30">
      <div className="px-6 py-5 border-b border-navy-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-bold text-sm">I</div>
          <div>
            <span className="font-bold text-lg tracking-tight">incuxAI</span>
            <span className="block text-xs text-slate-400 -mt-0.5">Admin Panel</span>
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
                active ? 'bg-brand text-white' : 'text-slate-300 hover:bg-navy-light hover:text-white'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-navy-light">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-xs font-bold">
            {user?.initials ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName ?? '...'}</p>
            <p className="text-xs text-brand-light truncate capitalize">{user?.role}</p>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-navy-light text-slate-400">
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </aside>
  )
}
