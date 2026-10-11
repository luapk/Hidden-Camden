'use client'

import { useState } from 'react'
import Image from 'next/image'
import { monogram, type TourGuide } from '@/lib/tour/guides'

/**
 * A guide's portrait in a circle, or their monogram when there is no photo
 * (or it fails to load). Remote portraits load straight from Wikimedia,
 * unoptimised, so a dead link simply falls back to the monogram.
 */
export default function GuideAvatar({
  guide,
  size,
  className = '',
  monogramClassName = 'bg-black text-acid',
}: {
  guide: TourGuide
  /** Pixel diameter. */
  size: number
  className?: string
  monogramClassName?: string
}) {
  // Per guide: the header pill swaps guides as you walk.
  const [failedId, setFailedId] = useState<string | null>(null)
  const showImage = !!guide.image && failedId !== guide.id

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        showImage ? 'bg-night-3' : monogramClassName
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          key={guide.id}
          src={guide.image!}
          alt={guide.name}
          fill
          unoptimized={guide.image!.startsWith('http')}
          sizes={`${size}px`}
          className="object-cover"
          style={{
            objectPosition: guide.imagePosition ?? 'center 20%',
            filter: 'grayscale(15%) contrast(1.05)',
          }}
          onError={() => setFailedId(guide.id)}
        />
      ) : (
        <span
          className="font-grotesk font-bold leading-none tracking-tight"
          style={{ fontSize: Math.max(9, Math.round(size * 0.34)) }}
        >
          {monogram(guide.name)}
        </span>
      )}
    </span>
  )
}
