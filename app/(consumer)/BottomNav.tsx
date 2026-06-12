'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BeerStein,
  BookOpen,
  MapPin,
  Question,
  Wallet,
  type Icon,
} from '@phosphor-icons/react'

interface NavItem {
  href: string
  label: string
  icon: Icon
  accent: string
}

const ITEMS: NavItem[] = [
  { href: '/', label: 'Tour', icon: MapPin, accent: '#D8432F' },
  { href: '/wallet', label: 'Wallet', icon: Wallet, accent: '#2563EB' },
  { href: '/rewards', label: 'Rewards', icon: BeerStein, accent: '#C9933C' },
  { href: '/how-it-works', label: 'Guide', icon: BookOpen, accent: '#8B5CF6' },
  { href: '/help', label: 'Help', icon: Question, accent: '#EC4899' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
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
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="cc-nav-pill"
                  className="absolute inset-x-2 inset-y-0 rounded-xl"
                  style={{ backgroundColor: `${item.accent}1A` }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <IconComponent
                size={22}
                weight={active ? 'fill' : 'bold'}
                color={active ? item.accent : '#8A8077'}
                className="relative"
              />
              <span
                className="relative text-[10px] font-semibold"
                style={{ color: active ? item.accent : '#8A8077' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
