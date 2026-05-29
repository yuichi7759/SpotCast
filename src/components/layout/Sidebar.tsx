'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden sm:flex flex-col flex-shrink-0 items-center"
      style={{
        width: '52px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        padding: '12px 0 16px',
        justifyContent: 'flex-end',
      }}
    >
      {/* Settings */}
      <Link
        href="/settings"
        title="設定"
        className="flex items-center justify-center w-9 h-9 rounded-lg transition"
        style={{
          color: pathname === '/settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: pathname === '/settings' ? 'var(--surface2)' : 'transparent',
        }}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
        </svg>
      </Link>
    </aside>
  )
}
