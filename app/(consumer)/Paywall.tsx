'use client'

import { motion } from 'framer-motion'
import { LockSimple, X } from '@phosphor-icons/react'

const STUB_ENABLED = process.env.NEXT_PUBLIC_PAYWALL_STUB !== 'false'

export default function Paywall({
  onUnlock,
  onClose,
}: {
  onUnlock: () => void
  onClose: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink"
      >
        <X size={18} weight="bold" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white"
          style={{
            background: 'linear-gradient(90deg, #D8432F, #EC4899)',
          }}
        >
          <LockSimple size={13} weight="bold" />
          Story locked ahead
        </span>

        <h2 className="mt-4 font-display text-[52px] uppercase leading-[0.95] text-ink">
          The last <span className="text-camden">five</span>
        </h2>

        <p className="mt-4 text-[15px] leading-relaxed text-ink/80">
          Two stories down. Five to go, and the best pints are ahead. A lie
          about jazz, a pool table that ran the nineties, a hiding place, and
          the night punk went overground.
        </p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-display text-4xl text-ink">£4.99</span>
          <span className="font-mono text-[12px] text-smoke">
            less than the pint already in your pocket
          </span>
        </div>

        <button
          onClick={() => {
            if (STUB_ENABLED) onUnlock()
          }}
          className="mt-6 w-full rounded-2xl px-5 py-4 font-display text-lg uppercase tracking-[0.06em] text-white shadow-lg"
          style={{
            background: 'linear-gradient(90deg, #D8432F 0%, #EC4899 60%, #8B5CF6 100%)',
          }}
        >
          Unlock the last five
        </button>

        <p className="mt-3 text-center font-mono text-[11px] text-smoke">
          One purchase, yours for keeps.
        </p>

        <button
          onClick={onClose}
          className="mt-5 w-full text-center text-[13px] text-smoke underline underline-offset-2"
        >
          Not now. Keep my free drinks.
        </button>
      </motion.div>
    </div>
  )
}
