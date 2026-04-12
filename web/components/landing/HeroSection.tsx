import Link from 'next/link'
import { HeroPackAnimation } from './HeroPackAnimation'

// ── HeroSection ───────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-line-grid overflow-hidden">
      {/* Radial glow backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(99,102,241,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(245,158,11,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* ── Left: copy ── */}
          <div className="flex flex-col gap-6">
            {/* Overline */}
            <div className="anim-1">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400/80 border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Trinidad &amp; Tobago&apos;s First
              </span>
            </div>

            {/* Headline */}
            <div className="anim-2">
              <h1
                className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Your Next{' '}
                <span className="gradient-text-animate">Client</span>{' '}
                Is Waiting Inside
              </h1>
            </div>

            {/* Subheadline */}
            <p className="anim-3 text-lg text-[#8892a4] leading-relaxed max-w-lg">
              LeadPack T&amp;T delivers exclusive, verified insurance leads straight
              to your dashboard. Crack open a pack. Close the deal.
            </p>

            {/* CTA buttons */}
            <div className="anim-4 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl btn-glow-indigo font-semibold"
              >
                Start Closing Deals
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl btn-ghost font-semibold"
              >
                I Have an Account
              </Link>
            </div>

            {/* Trust stats */}
            <div className="anim-5 flex flex-wrap gap-6 pt-2">
              {[
                { value: '500+', label: 'Leads Delivered' },
                { value: '50+',  label: 'Agents Active'   },
                { value: '98%',  label: 'Verified'        },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-xs text-[#6b7a9e] uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: hero pack animation ── */}
          <div className="relative w-full anim-2 flex items-center justify-center">
            <HeroPackAnimation />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #05080f)' }}
      />
    </section>
  )
}
