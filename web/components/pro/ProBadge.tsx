/**
 * Luxe "PRO" badge with a crown.
 * Renders a gold foil gradient pill with a crown icon sitting above it.
 * Use size="sm" in tight spaces (header), size="md" as default.
 */
export function ProBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const isSm = size === 'sm'

  return (
    <span className="relative inline-flex flex-col items-center" aria-label="Legendary Pro member">
      {/* Crown */}
      <svg
        viewBox="0 0 20 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isSm ? 'w-3.5 h-2 -mb-0.5' : 'w-4 h-2.5 -mb-0.5'}
        aria-hidden="true"
      >
        <path
          d="M1 11 L4 3 L7.5 7.5 L10 1 L12.5 7.5 L16 3 L19 11 Z"
          fill="url(#crownGold)"
          stroke="url(#crownGoldStroke)"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        {/* Three jewels on the crown points */}
        <circle cx="10" cy="1.2"  r="1"   fill="#fde68a" />
        <circle cx="4"  cy="3.2"  r="0.8" fill="#fde68a" />
        <circle cx="16" cy="3.2"  r="0.8" fill="#fde68a" />
        <defs>
          <linearGradient id="crownGold" x1="0" y1="0" x2="20" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#fbbf24" />
            <stop offset="45%"  stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="crownGoldStroke" x1="0" y1="0" x2="20" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
      </svg>

      {/* Pill */}
      <span
        className={[
          'relative inline-flex items-center font-black tracking-widest uppercase',
          'rounded-full border',
          'shadow-[0_0_8px_rgba(251,191,36,0.35)]',
          isSm
            ? 'text-[9px] px-2 py-0.5 border-amber-600/60'
            : 'text-[10px] px-2.5 py-0.5 border-amber-500/60',
        ].join(' ')}
        style={{
          background: 'linear-gradient(135deg, #78350f 0%, #b45309 30%, #fbbf24 50%, #d97706 70%, #78350f 100%)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          // Outer pill background
          boxShadow: '0 0 10px rgba(251,191,36,0.2), inset 0 1px 0 rgba(253,230,138,0.15)',
        }}
      >
        {/* Actual pill background layer */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #1c0a00 0%, #2d1500 40%, #1a0900 100%)',
            border: '1px solid transparent',
            backgroundClip: 'padding-box',
          }}
          aria-hidden="true"
        />
        <span className="relative z-10"
          style={{
            background: 'linear-gradient(90deg, #fbbf24 0%, #fde68a 40%, #f59e0b 70%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.6))',
          }}>
          Pro
        </span>
      </span>
    </span>
  )
}
