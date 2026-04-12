'use client'

import type { CSSProperties } from 'react'

// ── Hero Pack Animation ───────────────────────────────────────────────────────
// Decorative landing hero animation: three pack card faces cascade from above
// and settle into a layered floating arrangement.
// Mirrors PackCard.tsx visuals without the interactive state machine.

type CardDef = {
  rgb:        string
  accent:     string
  bgFrom:     string
  bgMid:      string
  abbr:       string
  abbrSize:   string
  label:      string
  subtitle:   string
  price:      string
  glowPos:    string
  glowSize:   string
  sparkles:   string[]
  legendary?: boolean
  wrapStyle:  CSSProperties
  animClass:  string
}

const CARDS: CardDef[] = [
  {
    // Standard — right side, behind (z-index 1)
    rgb:       '6,182,212',
    accent:    '#22d3ee',
    bgFrom:    '#010c12',
    bgMid:     '#021522',
    abbr:      'STD',
    abbrSize:  '4rem',
    label:     'Standard Pack',
    subtitle:  'Entry-level leads · Shared access',
    price:     'TT$30',
    glowPos:   '50% 30%',
    glowSize:  '85% 60%',
    sparkles:  ['✦', '✦', '✧', '✦'],
    wrapStyle: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(calc(-50% + 68px), calc(-50% + 36px)) rotate(10deg)',
      zIndex: 1,
    },
    animClass: 'hero-cascade-std',
  },
  {
    // Premium — left side, middle (z-index 2)
    rgb:       '139,92,246',
    accent:    '#a78bfa',
    bgFrom:    '#07030e',
    bgMid:     '#110a2a',
    abbr:      'PREM',
    abbrSize:  '3.4rem',
    label:     'Premium Pack',
    subtitle:  'High-quality leads · Shared access',
    price:     'TT$60',
    glowPos:   '50% 30%',
    glowSize:  '85% 60%',
    sparkles:  ['✦', '★', '✦', '★'],
    wrapStyle: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(calc(-50% - 62px), calc(-50% + 18px)) rotate(-7deg)',
      zIndex: 2,
    },
    animClass: 'hero-cascade-prem',
  },
  {
    // Legendary — center, front, slightly larger (z-index 3)
    rgb:       '245,158,11',
    accent:    '#fbbf24',
    bgFrom:    '#0d0600',
    bgMid:     '#1c0d00',
    abbr:      'LEGD',
    abbrSize:  '3.4rem',
    label:     'Legendary Pack',
    subtitle:  'Elite high-income leads · Exclusive',
    price:     'TT$100',
    glowPos:   '50% 35%',
    glowSize:  '95% 70%',
    sparkles:  ['★', '✦', '★', '✦'],
    legendary: true,
    wrapStyle: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(calc(-50% + 2px), calc(-50% - 22px)) rotate(1deg) scale(1.09)',
      zIndex: 3,
    },
    animClass: 'hero-cascade-legd',
  },
]

function HeroCard({ def }: { def: CardDef }) {
  const {
    rgb, accent, bgFrom, bgMid, abbr, abbrSize, label, subtitle,
    price, glowPos, glowSize, sparkles, legendary, wrapStyle, animClass,
  } = def

  const boxShadow = legendary
    ? `0 0 0 1px rgba(${rgb},0.72), 0 20px 64px rgba(0,0,0,0.94), 0 0 60px rgba(${rgb},0.42), 0 0 120px rgba(${rgb},0.18)`
    : `0 0 0 1px rgba(${rgb},0.52), 0 12px 44px rgba(0,0,0,0.86), 0 0 32px rgba(${rgb},0.22)`

  return (
    <div style={wrapStyle}>
      {/* Inner div carries the cascade/float animation so it doesn't conflict
          with the outer wrapper's static positioning transform */}
      <div className={animClass} style={{ width: 215, height: 310 }}>
        <div
          className="relative overflow-hidden rounded-2xl flex flex-col h-full"
          style={{
            background: `
              radial-gradient(ellipse ${glowSize} at ${glowPos},
                rgba(${rgb}, 0.32) 0%, transparent 68%),
              linear-gradient(170deg, ${bgFrom} 0%, ${bgMid} 45%, ${bgFrom} 100%)
            `,
            boxShadow,
          }}
        >
          {/* ── Diagonal light rays ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div style={{
              position: 'absolute', top: '-60%', left: '-15%',
              width: '45%', height: '220%',
              background: `linear-gradient(90deg, transparent, rgba(${rgb},0.14), transparent)`,
              transform: 'rotate(-28deg)',
            }} />
            <div style={{
              position: 'absolute', top: '-60%', left: '25%',
              width: '28%', height: '220%',
              background: `linear-gradient(90deg, transparent, rgba(${rgb},0.07), transparent)`,
              transform: 'rotate(-28deg)',
            }} />
            {legendary && (
              <div style={{
                position: 'absolute', top: '-60%', left: '60%',
                width: '22%', height: '220%',
                background: `linear-gradient(90deg, transparent, rgba(${rgb},0.18), transparent)`,
                transform: 'rotate(-28deg)',
              }} />
            )}
          </div>

          {/* ── Shimmer sweep ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="pack-shimmer absolute top-0 bottom-0 w-2/5"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                transform: 'translateX(-100%) skewX(-20deg)',
              }}
            />
          </div>

          {/* ── Top bar: brand + tier chip ── */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-1">
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-700 select-none">
              LeadPack
            </span>
            <span style={{
              fontSize: 8,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              padding: '3px 8px',
              borderRadius: 6,
              color: accent,
              background: `rgba(${rgb},0.12)`,
              border: `1px solid rgba(${rgb},0.35)`,
            }}>
              {abbr}
            </span>
          </div>

          {/* ── Giant tier abbreviation ── */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-4 pt-1 pb-2">
            <p
              className="font-black leading-none select-none"
              style={{
                fontSize: abbrSize,
                color: '#ffffff',
                textShadow: `
                  0 0 14px rgba(${rgb},1),
                  0 0 30px rgba(${rgb},0.92),
                  0 0 62px rgba(${rgb},0.68),
                  0 0 120px rgba(${rgb},0.38)
                `,
                letterSpacing: '-0.02em',
              }}
            >
              {abbr}
            </p>

            <div className="flex items-center gap-1.5 mt-3">
              {sparkles.map((s, i) => (
                <span key={i} className="text-[10px] select-none" style={{ color: accent, opacity: 0.65 }}>
                  {s}
                </span>
              ))}
            </div>

            <p className="text-xs font-bold text-white mt-2 leading-tight">{label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{subtitle}</p>
          </div>

          {/* ── Gradient divider ── */}
          <div
            className="relative z-10 mx-4"
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, rgba(${rgb},0.52), transparent)`,
            }}
          />

          {/* ── Footer: price + Crack Pack CTA ── */}
          <div className="relative z-10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Price</p>
              <p
                className="text-sm font-black text-white"
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              >
                {price}
              </p>
            </div>
            <div
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg select-none"
              style={{
                color:      legendary ? '#1c1000' : '#fff',
                background: `rgba(${rgb},${legendary ? '1' : '0.82'})`,
                boxShadow:  `0 0 14px rgba(${rgb},0.60)`,
              }}
            >
              Crack Pack
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroPackAnimation() {
  return (
    <div
      className="relative mx-auto"
      style={{ width: 480, height: 460 }}
      aria-hidden="true"
    >
      {CARDS.map((card) => (
        <HeroCard key={card.abbr} def={card} />
      ))}
    </div>
  )
}
