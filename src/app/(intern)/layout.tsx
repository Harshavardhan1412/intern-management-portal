import InternSidebar from '@/components/layout/InternSidebar'
import Topbar from '@/components/layout/Topbar'

export default function InternLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50">
      <InternSidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
