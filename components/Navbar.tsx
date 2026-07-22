'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from '@/components/WalletButton'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Campaigns' },
  { href: '/campaigns/create', label: 'Create' },
  { href: '/campaigns/mine', label: 'My Campaigns' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-foreground shrink-0">
            ChainFund
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname === href
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/debug" className="hidden md:inline text-xs text-muted-foreground hover:text-foreground">
            Advanced console
          </Link>
          <WalletButton />
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex sm:hidden items-center gap-1 px-4 pb-3 -mt-1">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              pathname === href ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
