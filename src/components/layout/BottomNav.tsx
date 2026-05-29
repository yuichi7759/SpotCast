'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'マップ', icon: (
    <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="7" r="3"/>
      <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/>
    </svg>
  )},
  { href: '/settings', label: '設定', icon: (
    <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
    </svg>
  )},
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--sidebar-bg)' }}>
      {nav.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[11px] font-medium transition"
          style={{ color: pathname === item.href ? '#60a5fa' : 'var(--text-secondary)' }}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
