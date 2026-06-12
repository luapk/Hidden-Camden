import type { Metadata } from 'next'
import { Anton, Courier_Prime } from 'next/font/google'
import './globals.css'

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
})

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-courier',
  display: 'swap',
})

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
      <body className={`${anton.variable} ${courierPrime.variable}`}>
        {children}
      </body>
    </html>
  )
}
