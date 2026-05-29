'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/',        label: '問卦', char: '卦' },
  { href: '/history', label: '歷史', char: '史' },
  { href: '/profile', label: '我的', char: '我' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="主要導覽"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md
                  bg-paper/95 backdrop-blur-sm border-t-2 border-ink/10
                  flex items-stretch justify-around z-50"
    >
      {TABS.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center
                        py-3 px-6 flex-1 min-h-[64px] relative
                        transition-colors
                        ${active ? 'text-vermilion' : 'text-inkDark/60'}`}
          >
            {/* active 頂部指示線 */}
            {active && (
              <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-vermilion rounded-full" />
            )}
            <span className={`text-2xl font-bold leading-none mb-1
                              ${active ? 'text-vermilion' : 'text-inkDark/50'}`}>
              {tab.char}
            </span>
            <span className="text-sm font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
