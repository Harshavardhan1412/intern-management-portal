import DirectorSidebar from '@/components/layout/DirectorSidebar'
import Topbar from '@/components/layout/Topbar'

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <DirectorSidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
