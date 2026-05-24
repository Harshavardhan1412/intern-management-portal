'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your activities' },
  '/attendance': { title: 'Attendance', subtitle: 'Track your check-ins and history' },
  '/tasks': { title: 'Tasks', subtitle: 'Manage your assignments' },
  '/projects': { title: 'Projects', subtitle: 'Track project progress' },
  '/groups': { title: 'Groups', subtitle: 'Your teams and collaborators' },
  '/leave': { title: 'Leave', subtitle: 'Manage your leave requests' },
  '/announcements': { title: 'Announcements', subtitle: 'Stay updated with the latest from IncuxAI' },
  '/profile': { title: 'Profile', subtitle: 'Your personal information' },
  '/admin/dashboard': { title: 'Admin Dashboard', subtitle: 'Platform overview and KPIs' },
  '/admin/interns': { title: 'Intern Management', subtitle: 'Create and manage intern profiles' },
  '/admin/attendance': { title: 'Attendance Control', subtitle: 'Monitor and verify attendance' },
  '/admin/tasks': { title: 'Task Management', subtitle: 'Create, assign, and review tasks' },
  '/admin/projects': { title: 'Project Management', subtitle: 'Track all projects' },
  '/admin/groups': { title: 'Group Management', subtitle: 'Manage teams' },
  '/admin/evaluations': { title: 'Evaluations', subtitle: 'Score intern performance' },
  '/admin/announcements': { title: 'Announcements', subtitle: 'Broadcast company updates' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Platform insights and reports' },
  '/director/dashboard': { title: 'Director Dashboard', subtitle: 'Project and task oversight' },
  '/director/projects': { title: 'Projects', subtitle: 'Track all projects' },
  '/director/tasks': { title: 'Tasks', subtitle: 'View and assign tasks' },
  '/director/leaves': { title: 'Leave Requests', subtitle: 'Approve or reject leaves' },
  '/director/announcements': { title: 'Announcements', subtitle: 'Send updates' },
  '/director/evaluations': { title: 'Evaluations', subtitle: 'View intern performance' },
}

export default function Topbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const info = titles[pathname] ?? { title: 'IncuxAI', subtitle: 'Intern Management Platform' }

  return (
    <header className="sticky top-0 z-20 bg-white border-b" style={{ borderColor: '#E2E8F0' }}>
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{info.title}</h1>
          <p className="text-sm text-slate-500">{info.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <Link
            href="/profile"
            className="flex items-center gap-3 pl-4 border-l hover:bg-slate-50 -mr-2 pr-2 py-1 rounded-lg transition-colors"
            style={{ borderColor: '#E2E8F0' }}
          >
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.fullName ?? '...'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-sm font-semibold text-white">
              {user?.initials ?? '?'}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
