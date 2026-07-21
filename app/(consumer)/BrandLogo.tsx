import Image from 'next/image'

/**
 * The Hidden Camden wordmark: a torn acid-green fly-poster with black
 * stencil type. The black background is keyed out (public/brand/logo-cut.png)
 * so the poster sits on any surface, dark app chrome or cream ticket alike.
 */
export default function BrandLogo({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src="/brand/logo-cut.png"
      alt="Hidden Camden"
      width={1250}
      height={720}
      priority={priority}
      className={className}
    />
  )
}
