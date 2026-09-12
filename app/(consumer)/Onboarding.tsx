'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import BrandLogo from './BrandLogo'
import WalkPicker from './GuidePicker'

/**
 * First-run flow, shown once per browser (localStorage flag):
 *   1. Brand splash: logo, strapline, one line of what this is.
 *   2. Voice selection: pick the guide, then into the tour.
 */

const STORAGE_KEY = 'cc-onboarded'

export default function Onboarding() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<0 | 1>(0)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== 'ok') setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, 'ok')
    } catch {
      /* ignore — still close for this session */
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-night-1 text-label-1">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pb-8 pt-[max(env(safe-area-inset-top),24px)]">
        {step === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-10 rounded-full"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(204,255,0,0.18), transparent 70%)',
                }}
                aria-hidden
              />
              <BrandLogo className="relative mx-auto h-auto w-[270px]" priority />
            </div>

            <h1 className="mt-9 font-jost text-[27px] font-bold uppercase leading-[0.98] tracking-tight text-acid">
              The most musical half-mile on Earth
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-label-2">
              Camden&apos;s famous rock &apos;n&apos; stroll audio tour.
            </p>

            <button
              onClick={() => setStep(1)}
              className="mt-11 flex w-full items-center justify-center gap-2 rounded-xl bg-acid py-4 font-jost text-[18px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_30px_rgba(204,255,0,0.32)]"
            >
              Get started
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="pt-6">
              <div className="font-grotesk text-[10px] font-bold uppercase tracking-[0.3em] text-acid">
                Your voice
              </div>
              <h2 className="mt-2 font-jost text-[30px] font-bold uppercase leading-[0.98] tracking-tight text-label-1">
                Choose your guide
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-label-2">
                Pick the voice that walks you round. You can change it any time.
              </p>
            </div>

            <WalkPicker />

            <div className="mt-auto pt-6">
              <button
                onClick={dismiss}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-acid py-4 font-jost text-[18px] font-bold uppercase tracking-[0.08em] text-black shadow-[0_0_28px_rgba(204,255,0,0.3)]"
              >
                Let&apos;s walk
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
