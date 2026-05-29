import { Suspense } from 'react'
import ChatWindow from '@/components/chat/ChatWindow'

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Chat</span>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e] inline-block"/>
          online
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <Suspense>
          <ChatWindow/>
        </Suspense>
      </div>
    </div>
  )
}
