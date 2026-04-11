'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/dashboard',        label: 'Dashboard',      pro: false },
  { href: '/marketplace',      label: 'Marketplace',    pro: false },
  { href: '/journal',          label: 'My Journal',     pro: false },
  { href: '/wallet',           label: 'Wallet',         pro: false },
  { href: '/pro/pipeline',     label: 'Pipeline',       pro: true  },
  { href: '/pro/analytics',    label: 'Analytics',      pro: true  },
  { href: '/pro/templates',    label: 'Templates',      pro: true  },
  { href: '/pro/subscriptions',label: 'Subscriptions',  pro: true  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col pt-6">
      <nav className="flex flex-col gap-1 px-3">
        {NAV_LINKS.map(({ href, label, pro }) => {
          const active = pathname.startsWith(href)

          if (pro) {
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'border-l-2',
                  active
                    ? 'bg-amber-950/40 text-amber-300 border-amber-400'
                    : 'text-amber-600/80 hover:text-amber-300 hover:bg-amber-950/30 border-amber-800/50',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
