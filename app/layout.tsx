import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Camden Crawl',
  description: 'A geofenced audio tour of Camden music venues.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
