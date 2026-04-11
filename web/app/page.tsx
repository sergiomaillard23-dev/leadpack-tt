import { Syne, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { Navbar }       from '@/components/landing/Navbar'
import { HeroSection }  from '@/components/landing/HeroSection'
import { HowItWorks }   from '@/components/landing/HowItWorks'
import { PricingTiers } from '@/components/landing/PricingTiers'
import { ProSection }   from '@/components/landing/ProSection'
import { Testimonials } from '@/components/landing/Testimonials'
import { FAQ }          from '@/components/landing/FAQ'
import { FinalCTA }     from '@/components/landing/FinalCTA'
import { Footer }       from '@/components/landing/Footer'
import './(landing)/landing.css'

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

export default function LandingPage() {
  return (
    <div
      className={`${syne.variable} ${jakarta.variable} ${jetbrains.variable} landing-root`}
    >
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <PricingTiers />
      <ProSection />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
