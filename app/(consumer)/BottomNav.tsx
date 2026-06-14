'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BeerStein,
  BookOpen,
  GearSix,
  MapPin,
  Wallet,
  type Icon,
} from '@phosphor-icons/react'

interface NavItem {
  href: string
  label: string
  icon: Icon
}

const ITEMS: NavItem[] = [
  { href: '/', label: 'Tour', icon: MapPin },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/rewards', label: 'Rewards', icon: BeerStein },
  { href: '/how-it-works', label: 'Guide', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: GearSix },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),16px)]">
      <div className="pointer-events-auto mx-4 flex max-w-md items-stretch justify-between rounded-full border border-white/15 bg-white/10 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:mx-auto sm:max-w-sm">
        {ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          const IconComponent = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="cc-nav-pill"
                  className="absolute inset-x-1 inset-y-0 rounded-full bg-white/10"
                  transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                />
              )}
              <IconComponent
                size={21}
                weight={active ? 'fill' : 'regular'}
                color={active ? '#CCFF00' : '#98989D'}
                className="relative"
                style={
                  active
                    ? { filter: 'drop-shadow(0 0 8px rgba(204,255,0,0.5))' }
                    : undefined
                }
              />
              <span
                className={`relative font-grotesk text-[9px] uppercase tracking-[0.12em] ${
                  active ? 'text-acid' : 'text-label-2'
                }`}
              >
                {item.label}
              </span>
              <span
                className={`relative mt-0.5 h-1 w-1 rounded-full transition-opacity ${
                  active
                    ? 'bg-acid opacity-100 shadow-[0_0_8px_rgba(204,255,0,0.8)]'
                    : 'opacity-0'
                }`}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
