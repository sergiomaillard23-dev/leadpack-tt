export const PACKS_PER_BATCH        = 4
export const PRIORITY_WINDOW_SECONDS = 300  // 5 minutes

// ── Pack tier definitions ─────────────────────────────────────────────────────
// price_ttd stored in cents (TTD). 100 cents = TT$1.00
// label maps to pack_label column (A/B/C/D).

export const PACK_TIERS = {
  STARTER: {
    label:      'A',
    name:       'Starter Pack',
    pack_type:  'COMMUNITY',
    pack_size:  5,
    price_ttd:  15000,   // TT$150.00 ($30/lead × 5)
    max_buyers: 3,
  },
  EXCLUSIVE_STARTER: {
    label:      'B',
    name:       'Exclusive Starter Pack',
    pack_type:  'EXCLUSIVE',
    pack_size:  5,
    price_ttd:  50000,   // TT$500.00 ($100/lead × 5)
    max_buyers: 1,
  },
  COMMUNITY: {
    label:      'C',
    name:       'Community Pack',
    pack_type:  'COMMUNITY',
    pack_size:  20,
    price_ttd:  60000,   // TT$600.00 ($30/lead × 20)
    max_buyers: 3,
  },
  EXCLUSIVE: {
    label:      'D',
    name:       'Exclusive Pack',
    pack_type:  'EXCLUSIVE',
    pack_size:  20,
    price_ttd:  200000,  // TT$2,000.00 ($100/lead × 20)
    max_buyers: 1,
  },
} as const

export type PackTierKey = keyof typeof PACK_TIERS

// ── Other business constants ──────────────────────────────────────────────────

export const LEGENDARY_INCOME_THRESHOLD_TTD = 25000  // monthly TTD
export const PRO_SUBSCRIPTION_PRICE_CENTS   = 20000  // TT$200.00/mo
export const PRO_MONTHLY_FREE_CREDITS       = 5
export const MAX_DISPUTES_PER_PACK          = 5
export const TIMEZONE                       = 'America/Port_of_Spain'
export const CURRENCY_LOCALE                = 'en-TT'
export const PHONE_REGEX                    = /^1-868-\d{3}-\d{4}$/
