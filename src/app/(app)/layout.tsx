import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import { ToastProvider } from '@/components/ToastProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <main className="flex-1 overflow-hidden flex flex-col pb-[56px] sm:pb-0">
          {children}
        </main>
        <BottomNav/>
      </div>
    </ToastProvider>
  )
}
