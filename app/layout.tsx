import type { Metadata } from 'next'
import { Anton, Courier_Prime, Jost, Space_Grotesk } from 'next/font/google'
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

const jost = Jost({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hidden Camden',
  description: 'A geofenced audio tour of Camden music venues.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${anton.variable} ${courierPrime.variable} ${jost.variable} ${spaceGrotesk.variable}`}
      >
        {children}
      </body>
    </html>
  )
}
