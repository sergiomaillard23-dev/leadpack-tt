import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#07090f]">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Decorative lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-4">
          Get Started Today
        </p>

        <h2
          className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.05] mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Ready to Grow{' '}
          <span className="gradient-text-animate">Your Book?</span>
        </h2>

        <p className="text-lg text-[#6b7a9e] mb-10 leading-relaxed">
          Join T&amp;T&rsquo;s first gamified insurance lead marketplace. Your next client is one crack away.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            Create Your Account
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-[#8892a4] hover:text-white hover:border-white/20 font-semibold text-base transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-8 text-xs text-[#4a5568]">
          Licensed T&amp;T insurance agents only &middot; KYC verification required &middot; No credit card to sign up
        </p>
      </div>
    </section>
  )
}
