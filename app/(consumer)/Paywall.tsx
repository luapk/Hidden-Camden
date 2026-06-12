'use client'

import { motion } from 'framer-motion'
import { LockSimple, X } from '@phosphor-icons/react'

const STUB_ENABLED = process.env.NEXT_PUBLIC_PAYWALL_STUB !== 'false'

const INCLUDED = [
  'A lie about jazz',
  'A pool table that ran the nineties',
  'A hiding place',
  'The night punk went overground',
]

export default function Paywall({
  onUnlock,
  onClose,
}: {
  onUnlock: () => void
  onClose: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-night px-6 py-10">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-night-3 text-label-1"
      >
        <X size={18} weight="bold" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.05 }}
      >
        <span className="inline-flex items-center gap-1.5 border border-acid/40 px-3 py-1 font-grotesk text-[11px] uppercase tracking-[0.25em] text-acid">
          <LockSimple size={13} weight="bold" />
          Story locked ahead
        </span>

        <h2 className="mt-5 font-jost text-[56px] font-bold uppercase leading-[0.92] tracking-tight text-label-1">
          The last <span className="text-acid">five</span>
        </h2>

        <p className="mt-4 text-[15px] leading-relaxed text-label-2">
          Two stories down. Five to go, and the best pints are ahead.
        </p>

        <ul className="mt-5 border-t border-white/10">
          {INCLUDED.map((item, i) => (
            <li
              key={item}
              className="flex items-baseline gap-3 border-b border-white/10 py-2.5"
            >
              <span className="font-grotesk text-[11px] font-bold text-acid">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[14px] text-label-1">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-grotesk text-5xl font-bold tracking-tight text-label-1">
            £4.99
          </span>
          <span className="font-grotesk text-[12px] text-label-2">
            less than the pint already in your pocket
          </span>
        </div>

        <button
          onClick={() => {
            if (STUB_ENABLED) onUnlock()
          }}
          className="mt-6 w-full bg-acid px-5 py-4 font-jost text-lg font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(204,255,0,0.25)]"
        >
          Unlock the last five
        </button>

        <p className="mt-3 text-center font-grotesk text-[11px] text-label-3">
          One purchase, yours for keeps.
        </p>

        <button
          onClick={onClose}
          className="mt-5 w-full text-center text-[13px] text-label-2 underline underline-offset-4"
        >
          Not now. Keep my free drinks.
        </button>
      </motion.div>
    </div>
  )
}
