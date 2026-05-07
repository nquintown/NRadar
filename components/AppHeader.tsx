'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/',        label: '🏢 Enseigne → Centres' },
  { href: '/centers', label: '🛍️ Centres → Entreprises' },
]

export default function AppHeader() {
  const path = usePathname()
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 flex-shrink-0">
      <div className="max-w-screen-xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">NilsRadar</span>
          </Link>
          <nav className="flex gap-0.5 bg-gray-100 p-0.5 rounded-xl ml-1">
            {TABS.map(t => {
              const active = t.href === '/' ? path === '/' : path.startsWith(t.href)
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <span className="hidden sm:block text-xs text-gray-400">
          Analyse de proximité · Centres commerciaux
        </span>
      </div>
    </header>
  )
}
