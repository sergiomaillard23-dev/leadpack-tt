import Link from 'next/link'

const BENEFITS = [
  {
    icon: '⬡',
    label: 'Pipeline kanban board',
    detail: 'Move leads from NEW to CLOSED_WON with drag-and-drop.',
  },
  {
    icon: '◈',
    label: 'Analytics dashboard + ROI tracking',
    detail: 'See spend vs. commission, close rate, and OVR distribution.',
  },
  {
    icon: '◎',
    label: 'WhatsApp outreach with saved templates',
    detail: 'Pre-filled messages with variable interpolation — open in one click.',
  },
  {
    icon: '◆',
    label: '5 free pack credits every month',
    detail: 'TT$5 in credits granted on your billing date, every cycle.',
  },
  {
    icon: '★',
    label: 'Early access to Legendary packs',
    detail: 'See high net worth leads before they hit the open marketplace.',
  },
  {
    icon: '⤓',
    label: 'CSV export of your full lead book',
    detail: 'One click exports every lead, status, and note to a spreadsheet.',
  },
]

const MOCK_TILES = [
  { label: 'Total Leads',     value: '140',  sub: 'across all packs'    },
  { label: 'Close Rate',      value: '38%',  sub: 'won ÷ (won + lost)'  },
  { label: 'Pipeline Value',  value: '92',   sub: 'leads in progress'   },
]

export function ProSection() {
  return (
    <section
      id="pro"
      className="py-24 bg-[#07090f] relative overflow-hidden bg-dot-grid"
    >
      {/* Ambient gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 20% 50%, rgba(245,158,11,0.07) 0%, transparent 65%), ' +
            'radial-gradient(ellipse 40% 40% at 80% 80%, rgba(217,119,6,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: copy ── */}
          <div className="anim-1 flex flex-col gap-6">

            {/* Overline badge */}
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] border px-3 py-1.5 rounded-full border-amber-500/30 bg-amber-500/5"
                style={{
                  color: '#fbbf24',
                  boxShadow: '0 0 12px rgba(251,191,36,0.15)',
                }}>
                {/* Crown SVG */}
                <svg viewBox="0 0 20 12" className="w-3.5 h-2" fill="none" aria-hidden="true">
                  <path d="M1 11 L4 3 L7.5 7.5 L10 1 L12.5 7.5 L16 3 L19 11 Z"
                    fill="#fbbf24" stroke="#d97706" strokeWidth="0.6" strokeLinejoin="round" />
                  <circle cx="10" cy="1.2" r="1"   fill="#fde68a" />
                  <circle cx="4"  cy="3.2" r="0.8" fill="#fde68a" />
                  <circle cx="16" cy="3.2" r="0.8" fill="#fde68a" />
                </svg>
                Legendary Pro
              </span>
            </div>

            {/* Headline */}
            <h2
              className="text-4xl lg:text-5xl font-extrabold leading-[1.07] tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Everything a{' '}
              <span className="gradient-text-animate">Serious Agent</span>{' '}
              Needs
            </h2>

            {/* Subhead */}
            <p className="text-lg text-[#8892a4] leading-relaxed max-w-lg">
              One membership unlocks your full CRM suite — pipeline, analytics,
              WhatsApp outreach, and more. Stop juggling spreadsheets.
            </p>

            {/* Benefit list */}
            <ul className="flex flex-col gap-4 mt-2">
              {BENEFITS.map((b) => (
                <li key={b.label} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full text-[10px]"
                    style={{
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#fbbf24',
                    }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-white">{b.label}</span>
                    <span className="text-sm text-[#6b7a9e]"> — {b.detail}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Price + CTA */}
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-extrabold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: 'linear-gradient(90deg, #fbbf24 0%, #fde68a 50%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  TT$5,000
                </span>
                <span className="text-[#6b7a9e] text-sm">/ year</span>
                <span className="text-xs text-[#4a5568] ml-1">(TT$417/mo)</span>
              </div>

              <Link
                href="/pro/upgrade"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #92400e 0%, #b45309 30%, #d97706 60%, #92400e 100%)',
                  backgroundSize: '200% 200%',
                  color: '#fde68a',
                  boxShadow: '0 0 20px rgba(245,158,11,0.25), inset 0 1px 0 rgba(253,230,138,0.1)',
                  border: '1px solid rgba(245,158,11,0.4)',
                }}
              >
                Upgrade to Pro
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <p className="text-xs text-[#4a5568]">
                Already an agent?{' '}
                <Link href="/login" className="text-amber-600/80 hover:text-amber-400 transition-colors underline underline-offset-2">
                  Log in and upgrade in minutes.
                </Link>
              </p>
            </div>
          </div>

          {/* ── Right: mock dashboard ── */}
          <div className="anim-2 flex flex-col gap-4">
            {/* Mock header bar */}
            <div
              className="rounded-2xl border p-5"
              style={{
                background: 'linear-gradient(135deg, #0d0a00 0%, #1a1000 100%)',
                border: '1px solid rgba(245,158,11,0.15)',
                boxShadow: '0 0 40px rgba(245,158,11,0.08)',
              }}
            >
              {/* Fake title bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                  <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-widest">
                    Pro Dashboard
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
              </div>

              {/* Stat tiles */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {MOCK_TILES.map((tile) => (
                  <div
                    key={tile.label}
                    className="rounded-xl p-3 flex flex-col gap-1"
                    style={{
                      background: 'rgba(245,158,11,0.05)',
                      border: '1px solid rgba(245,158,11,0.1)',
                    }}
                  >
                    <span className="text-[10px] text-[#6b7a9e] uppercase tracking-wider">{tile.label}</span>
                    <span
                      className="text-xl font-bold text-amber-400"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {tile.value}
                    </span>
                    <span className="text-[9px] text-[#4a5568]">{tile.sub}</span>
                  </div>
                ))}
              </div>

              {/* Mock kanban strip */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-[#4a5568] uppercase tracking-wider mb-1">Pipeline</span>
                {[
                  { name: 'K. Thompson',  status: 'QUOTED',      color: 'bg-violet-500/60' },
                  { name: 'M. Phillip',   status: 'CONTACTED',   color: 'bg-indigo-500/60' },
                  { name: 'A. Joseph',    status: 'CLOSED_WON',  color: 'bg-emerald-500/60' },
                  { name: 'D. Williams',  status: 'NEW',         color: 'bg-gray-500/40' },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-xs text-[#8892a4]">{row.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${row.color}`}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp template preview card */}
            <div
              className="rounded-2xl border p-4"
              style={{
                background: 'rgba(245,158,11,0.03)',
                border: '1px solid rgba(245,158,11,0.1)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-widest">WhatsApp Template</span>
              </div>
              <p className="text-xs text-[#6b7a9e] leading-relaxed italic">
                &ldquo;Good day <span className="text-amber-500/80">{'{{firstName}}'}</span>, my name is Marcus from Sagicor Life. I am reaching out regarding a financial planning consultation. Would you be available for a brief call this week?&rdquo;
              </p>
              <div className="mt-3 flex gap-2">
                <div className="h-6 flex-1 rounded bg-white/[0.04] border border-white/[0.06]" />
                <div
                  className="h-6 px-3 rounded text-[10px] font-semibold flex items-center"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  Open WhatsApp
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
