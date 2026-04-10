'use client'
import { useState } from 'react'

const QUESTIONS = [
  {
    q: 'What is LeadPack T&T?',
    a: 'LeadPack is a lead marketplace built exclusively for insurance agents in Trinidad & Tobago. We deliver packs of verified leads organised by tier — Standard (5 leads), Premium (20 leads), and Legendary (20 high net worth leads) — so you spend more time closing and less time prospecting.',
  },
  {
    q: 'How do I get started?',
    a: 'Sign up for a free account, upload your insurance licence and two forms of government-issued ID, and wait for admin approval — usually within 24 hours. Once approved, you can browse and crack packs immediately.',
  },
  {
    q: 'What does "crack a pack" mean?',
    a: 'When you crack a pack, you unlock a 5-minute priority preview window to see the leads inside. If you like what you see, you purchase before the timer runs out and the leads are yours. If not, the pack re-locks and returns to the marketplace.',
  },
  {
    q: 'Can multiple agents buy the same leads?',
    a: 'It depends on the tier. Standard packs are sold to up to 3 agents. Premium packs are also shared with up to 3 agents. Legendary packs are fully exclusive — only one agent ever receives those leads.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We are integrating WiPay and First Atlantic Commerce (FAC) for local T&T dollar payments via credit/debit card. Additional top-up methods are coming soon.',
  },
  {
    q: 'How do I contact leads after purchase?',
    a: 'Purchased leads appear in your Trader Journal with full contact details — name, phone, email, and parish. WhatsApp outreach automation is available for Pro subscribers.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 bg-[#05080f]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-3">
            FAQ
          </p>
          <h2
            className="text-4xl lg:text-5xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Common{' '}
            <span className="text-indigo-400">Questions</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="flex flex-col divide-y divide-white/[0.06]">
          {QUESTIONS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`text-base font-semibold transition-colors ${
                      isOpen ? 'text-white' : 'text-[#8892a4] group-hover:text-white'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                      isOpen
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 rotate-45'
                        : 'border-white/10 text-[#6b7a9e] group-hover:border-white/20'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>
                <div className={`faq-body ${isOpen ? 'open' : ''}`}>
                  <p className="text-sm text-[#6b7a9e] leading-relaxed pb-5">{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
