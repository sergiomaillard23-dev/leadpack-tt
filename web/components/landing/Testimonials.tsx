const TESTIMONIALS = [
  {
    quote:
      'I closed two life policies in my first week using LeadPack. The leads are pre-qualified and the 5-minute crack window adds a real sense of urgency that keeps me focused.',
    name: 'Kezia Thompson',
    role: 'Life Insurance Agent · Guardian Life',
    initials: 'KT',
    color: 'bg-indigo-600',
  },
  {
    quote:
      'As a Sagicor agent, I used to spend half my day chasing cold leads. Now I crack two packs on Monday morning and my pipeline is set for the week. Truly a game-changer.',
    name: 'Marcus Phillip',
    role: 'Senior Agent · Sagicor Life',
    initials: 'MP',
    color: 'bg-violet-600',
  },
  {
    quote:
      'The Legendary packs are worth every cent. High net worth prospects who actually respond. My conversion rate jumped from 12% to over 30% after switching to LeadPack.',
    name: 'Aaliyah Joseph',
    role: 'Financial Planner · PALIG',
    initials: 'AJ',
    color: 'bg-amber-500',
  },
]

const TRUST_BADGES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Verified Leads Only',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: '24hr KYC Approval',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'T&T Agents Only',
  },
]

const STATS = [
  { value: '500+', label: 'Leads Delivered' },
  { value: '50+',  label: 'Agents Active'   },
  { value: '98%',  label: 'Verification Rate' },
  { value: '24hr', label: 'KYC Turnaround'  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-[#07090f]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 mb-3">
            Agent Stories
          </p>
          <h2
            className="text-4xl lg:text-5xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Agents Are{' '}
            <span className="text-emerald-400">Closing</span>
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-5 p-6 rounded-2xl border border-white/[0.07] bg-[#05080f] hover:border-white/[0.12] transition-colors"
            >
              {/* Quote marks */}
              <svg className="w-7 h-7 text-white/10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <p className="text-sm text-[#8892a4] leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>

              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div
                  className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[#6b7a9e]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[#8892a4]"
            >
              {badge.icon}
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl border border-white/[0.06] bg-[#05080f]">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-3xl font-extrabold text-white mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-[#6b7a9e] uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
