const STEPS = [
  {
    number: '01',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Sign Up & Get Verified',
    description:
      'Create your account, upload your insurance licence and two forms of ID, and get approved within 24 hours.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  {
    number: '02',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    title: 'Browse the Marketplace',
    description:
      'Pick from Standard, Premium, or Legendary packs — each containing 20 verified leads organised by exclusivity and income segment.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    number: '03',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Crack Your Pack',
    description:
      'Open a pack and preview the leads inside. You have 5 minutes to decide before the priority window expires and the pack re-locks.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    number: '04',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Close Deals',
    description:
      'Access full lead details in your Journal, reach out via WhatsApp, and track every prospect through your pipeline.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#07090f] relative">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-3">
            How It Works
          </p>
          <h2
            className="text-4xl lg:text-5xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            From Sign-Up to{' '}
            <span className="text-indigo-400">Closed Deal</span>
          </h2>
          <p className="mt-4 text-lg text-[#6b7a9e] max-w-xl mx-auto">
            Four steps stand between you and your next insurance client.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={`relative flex flex-col gap-4 p-6 rounded-2xl border ${step.border} bg-[#05080f] hover:border-opacity-60 transition-all hover:-translate-y-1`}
            >
              {/* Step number (background) */}
              <div
                className="absolute top-4 right-5 text-7xl font-black leading-none select-none pointer-events-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'rgba(255,255,255,0.03)',
                }}
              >
                {step.number}
              </div>

              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${step.bg} ${step.color} border ${step.border}`}>
                {step.icon}
              </div>

              {/* Number + title */}
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-widest ${step.color} font-mono`}>
                  Step {step.number}
                </span>
                <h3
                  className="text-base font-bold text-white mt-1 leading-snug"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {step.title}
                </h3>
              </div>

              <p className="text-sm text-[#6b7a9e] leading-relaxed">{step.description}</p>

              {/* Connector arrow (desktop only, not on last) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <svg className="w-6 h-6 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
