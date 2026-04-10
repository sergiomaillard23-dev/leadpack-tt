import type { Metadata } from 'next'
import { Syne, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './landing.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '800'],
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'LeadPack T&T — The Gamified Insurance Lead Marketplace',
  description:
    'Exclusive, verified insurance leads for T&T agents. Crack open a pack and close more deals.',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${syne.variable} ${jakarta.variable} ${jetbrains.variable} landing-root`}
    >
      {children}
    </div>
  )
}
