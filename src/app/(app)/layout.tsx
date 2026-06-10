import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ToastProvider } from '@/components/ToastProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // モバイル下部のタブ(マップ/設定)は廃止。設定はマップ上の歯車アイコンから、
  // 各画面は戻るボタンで遷移できるため冗長で、貴重な縦領域を消費していた。
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', height: '100dvh' }}>
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
