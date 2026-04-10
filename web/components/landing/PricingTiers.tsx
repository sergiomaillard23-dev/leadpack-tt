const TIERS = [
  {
    name: 'Standard',
    tagline: 'Start building your pipeline',
    price: 'TT$1,200',
    buyers: 'Up to 3 buyers',
    exclusivity: 'Community',
    income: 'Mixed income leads',
    color: 'blue',
    border: 'border-blue-500/30',
    glow: 'glow-blue',
    badge: 'bg-blue-600 text-white',
    cta: 'bg-blue-600 hover:bg-blue-500',
    icon: '◆',
    features: [
      '20 verified leads per pack',
      'Mixed income segments',
      'Shared with up to 3 agents',
      'Full contact details on purchase',
      'Trader Journal tracking',
    ],
    featured: false,
  },
  {
    name: 'Premium',
    tagline: 'For agents who mean business',
    price: 'TT$2,400',
    buyers: 'Up to 2 buyers',
    exclusivity: 'Limited',
    income: 'Mid-to-high income leads',
    color: 'purple',
    border: 'border-violet-500/40',
    glow: 'glow-purple',
    badge: 'bg-violet-600 text-white',
    cta: 'bg-violet-600 hover:bg-violet-500',
    icon: '◆◆',
    features: [
      '20 verified leads per pack',
      'Mid-to-high income prospects',
      'Shared with 1 other agent only',
      'Full contact details on purchase',
      'Trader Journal + priority support',
    ],
    featured: true,
  },
  {
    name: 'Legendary',
    tagline: 'High net worth. No competition.',
    price: 'TT$3,600',
    buyers: '1 buyer only',
    exclusivity: 'Exclusive',
    income: 'High net worth leads',
    color: 'gold',
    border: 'border-amber-500/50',
    glow: 'glow-gold-pulse',
    badge: 'bg-amber-500 text-black',
    cta: 'bg-amber-500 hover:bg-amber-400 text-black',
    icon: '★',
    features: [
      '20 verified leads per pack',
      'High net worth prospects only',
      'Exclusively yours — zero sharing',
      'Full contact details on purchase',
      'AI WhatsApp outreach (Pro)',
    ],
    featured: false,
    pro: true,
  },
]

export function PricingTiers() {
  return (
    <section id="pricing" className="py-24 bg-[#05080f] relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400 mb-3">
            Pack Tiers &amp; Pricing
          </p>
          <h2
            className="text-4xl lg:text-5xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Choose Your{' '}
            <span className="text-violet-400">Edge</span>
          </h2>
          <p className="mt-4 text-lg text-[#6b7a9e] max-w-xl mx-auto">
            Every pack contains 20 verified leads. Pick the exclusivity level that matches your ambition.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border ${tier.border} bg-[#07090f] p-7 transition-transform hover:-translate-y-1 ${
                tier.featured ? 'pricing-featured' : ''
              } ${tier.glow}`}
            >
              {/* Featured label */}
              {tier.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-violet-600 text-white border border-violet-400/30 whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Pro required badge */}
              {tier.pro && (
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Pro Required
                  </span>
                </div>
              )}

              {/* Tier header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${tier.badge} uppercase tracking-wider`}
                  >
                    {tier.name}
                  </span>
                  <span className="text-lg text-white/40">{tier.icon}</span>
                </div>
                <p className="text-sm text-[#6b7a9e]">{tier.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-2">
                <span
                  className="text-4xl font-extrabold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {tier.price}
                </span>
                <span className="text-sm text-[#6b7a9e] ml-1">/ pack</span>
              </div>
              <p className="text-sm text-[#6b7a9e] mb-6">
                {tier.exclusivity} · {tier.buyers}
              </p>

              {/* Divider */}
              <div className="h-px bg-white/[0.06] mb-6" />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-[#8892a4]">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="/register"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 ${tier.cta} ${tier.color !== 'gold' ? 'text-white' : ''}`}
              >
                Get {tier.name} Packs
              </a>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-xs text-[#4a5568] mt-8">
          All prices in TTD. Prices and tier structure may be updated prior to general availability.
        </p>
      </div>
    </section>
  )
}
