import DocumentManager from '@/components/chat/DocumentManager'

export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Documents</span>
      </header>
      <div className="flex-1 overflow-y-auto">
        <DocumentManager/>
      </div>
    </div>
  )
}
