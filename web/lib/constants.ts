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

export const LEGENDARY_INCOME_THRESHOLD_TTD   = 25000   // monthly TTD
export const PRO_SUBSCRIPTION_PRICE_CENTS     = 100000  // TT$1,000.00/mo
export const PRO_MONTHLY_FREE_CREDITS         = 5
export const PRO_EARLY_ACCESS_WINDOW_SECONDS  = 60      // 60s head start for Pro on Legendary packs
export const MAX_DISPUTES_PER_PACK            = 5
export const TIMEZONE                         = 'America/Port_of_Spain'
export const CURRENCY_LOCALE                  = 'en-TT'
export const PHONE_REGEX                      = /^1-868-\d{3}-\d{4}$/

// ── OVR Tier Thresholds ───────────────────────────────────────────────────────
export const LEGENDARY_OVR_THRESHOLD = 90  // OVR >= 90 = Legendary card tier
export const GOLD_OVR_THRESHOLD      = 80  // OVR 80–89 = Gold
export const SILVER_OVR_THRESHOLD    = 70  // OVR 70–79 = Silver
// OVR < 70 = Bronze

export const DROP_TIME_HOUR = 9  // Daily pack drop at 9:00 AM (Port of Spain time)

export const KYC_ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const KYC_MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB
export const KYC_DOC_FIELDS = ['INSURANCE_LICENSE', 'GOVERNMENT_ID_1', 'GOVERNMENT_ID_2'] as const
