import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAgentByEmail, isActivePro } from '@/lib/db/agents'
import { UpgradeForm } from '@/components/pro/UpgradeForm'
import { getDocuments } from '@/lib/db/kyc'

const BENEFITS = [
  {
    icon: '⬡',
    label: 'Pipeline Kanban Board',
    detail: 'Track every lead from first contact to closed deal. Move cards across NEW → CONTACTED → QUOTED → CLOSED_WON with a single click.',
  },
  {
    icon: '◈',
    label: 'Analytics Dashboard & ROI Tracking',
    detail: 'See exactly how much you spent on leads versus how much commission you earned. Know your close rate, OVR distribution, and pipeline value at a glance.',
  },
  {
    icon: '◎',
    label: 'WhatsApp Outreach with Saved Templates',
    detail: 'Pre-filled, professional message templates with variable interpolation. Reach a lead in one click — no copy-pasting, no fumbling.',
  },
  {
    icon: '★',
    label: 'Early Access to Legendary Packs',
    detail: 'High net worth leads — prospects with estimated household income above TT$25,000/month. Pro members see these before anyone else.',
  },
  {
    icon: '◆',
    label: '150 Free Pack Credits Every Month',
    detail: 'TT$150 in credits hit your wallet on your billing date, every single cycle — enough to crack a Standard pack on us.',
  },
  {
    icon: '⤓',
    label: 'CSV Export of Your Full Lead Book',
    detail: 'One click exports every lead, status, note, and commission figure into a spreadsheet you can take anywhere.',
  },
]

const ROI_POINTS = [
  {
    stat: '1 policy',
    label: 'pays for the membership',
    detail: 'The average life insurance commission on a mid-market policy in T&T exceeds TT$5,000. Close a single deal and Pro has already paid for itself.',
  },
  {
    stat: 'TT$417',
    label: 'per month, all-in',
    detail: 'Spread across 12 months, Pro costs less than a tank of gas a week — while your lead pipeline runs on autopilot.',
  },
  {
    stat: '~TT$14',
    label: 'per day',
    detail: 'Less than a lunch. In return you get a full CRM, analytics, outreach tools, and priority access to the highest-value leads in the market.',
  },
]

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let agent = null
  let kycApproved = false
  let kycDocs: string[] = []

  if (user?.email) {
    agent = await getAgentByEmail(user.email)
    if (agent && isActivePro(agent)) {
      const { redirect } = await import('next/navigation')
      redirect('/pro/pipeline')
    }
    if (agent) {
      kycApproved = agent.kyc_status === 'APPROVED'
      const docs = await getDocuments(agent.id)
      kycDocs = docs.map(d => d.doc_type)
    }
  }

  return (
    <div className="min-h-screen bg-[#05080f] text-white">

      {/* ── Nav strip ── */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">LEADPACK</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-widest">T&amp;T</span>
        </Link>
        {!agent && (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#8892a4] hover:text-white transition-colors">Log In</Link>
            <Link href="/register" className="text-sm font-semibold text-white px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors">
              Sign Up For Free
            </Link>
          </div>
        )}
      </div>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.10) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] border px-3 py-1.5 rounded-full border-amber-500/30 bg-amber-500/5 mb-6"
            style={{ color: '#fbbf24', boxShadow: '0 0 12px rgba(251,191,36,0.15)' }}>
            <svg viewBox="0 0 20 12" className="w-3.5 h-2" fill="none" aria-hidden="true">
              <path d="M1 11 L4 3 L7.5 7.5 L10 1 L12.5 7.5 L16 3 L19 11 Z"
                fill="#fbbf24" stroke="#d97706" strokeWidth="0.6" strokeLinejoin="round" />
              <circle cx="10" cy="1.2" r="1"   fill="#fde68a" />
              <circle cx="4"  cy="3.2" r="0.8" fill="#fde68a" />
              <circle cx="16" cy="3.2" r="0.8" fill="#fde68a" />
            </svg>
            Legendary Pro Membership
          </div>

          <h1
            className="text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            The Serious Agent&rsquo;s<br />
            <span style={{
              background: 'linear-gradient(90deg, #fbbf24 0%, #fde68a 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Unfair Advantage
            </span>
          </h1>

          <p className="text-lg text-[#8892a4] leading-relaxed max-w-2xl mx-auto">
            While other agents are relying on orphans and cold calling blind . . .
            you will be running a full CRM — pipeline, analytics, WhatsApp outreach,
            and priority access to the highest-value leads in Trinidad &amp; Tobago.
          </p>
        </div>
      </div>

      {/* ── ROI framing ── */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {ROI_POINTS.map((r) => (
            <div
              key={r.stat}
              className="rounded-2xl p-6 flex flex-col gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(217,119,6,0.03) 100%)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <span
                className="text-3xl font-extrabold"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(90deg, #fbbf24 0%, #fde68a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {r.stat}
              </span>
              <span className="text-sm font-semibold text-white">{r.label}</span>
              <p className="text-xs text-[#6b7a9e] leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Benefits ── */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2
          className="text-2xl font-extrabold text-white text-center mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Everything included in your membership
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.label}
              className="rounded-xl p-5 flex items-start gap-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span
                className="mt-0.5 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-base"
                style={{
                  background: 'rgba(245,158,11,0.10)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#fbbf24',
                }}
              >
                {b.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">{b.label}</p>
                <p className="text-xs text-[#6b7a9e] leading-relaxed">{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Price + form ── */}
      <div
        className="border-t border-white/[0.06]"
        style={{ background: 'rgba(245,158,11,0.02)' }}
      >
        <div className="max-w-2xl mx-auto px-6 py-20">

          {/* Price callout */}
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500/60 mb-4">Annual Membership</p>
            <div className="flex items-end justify-center gap-3 mb-3">
              <span
                className="text-6xl font-extrabold leading-none"
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
              <span className="text-[#6b7a9e] text-lg pb-1">/ year</span>
            </div>
            <p className="text-[#6b7a9e] text-sm">
              TT$417 per month &nbsp;·&nbsp; ~TT$14 per day &nbsp;·&nbsp; No auto-renewal
            </p>
            <div
              className="inline-block mt-4 px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: '#fbbf24',
              }}
            >
              One closed policy. That&rsquo;s all it takes to break even.
            </div>
          </div>

          {/* Form or CTA depending on auth state */}
          {agent ? (
            <UpgradeForm
              defaultName={agent.full_name}
              defaultEmail={agent.email}
              kycApproved={kycApproved}
              kycDocs={kycDocs}
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center flex flex-col gap-4">
              <p className="text-white font-semibold text-lg">Ready to upgrade?</p>
              <p className="text-[#6b7a9e] text-sm leading-relaxed">
                Create a free account first. Once your insurance licence is verified,
                you can upgrade to Pro in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #92400e 0%, #b45309 30%, #d97706 60%, #92400e 100%)',
                    color: '#fde68a',
                    boxShadow: '0 0 20px rgba(245,158,11,0.25)',
                    border: '1px solid rgba(245,158,11,0.4)',
                  }}
                >
                  Sign Up For Free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-sm border border-white/10 text-[#8892a4] hover:text-white hover:border-white/20 transition-colors"
                >
                  Already have an account? Log In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
