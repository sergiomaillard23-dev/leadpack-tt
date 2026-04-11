/**
 * Formats a TTD amount stored in cents to display format.
 * e.g. 10000 → "TT$100.00"
 */
export function formatCurrency(cents: number): string {
  const amount = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `TT$${amount}`
}

/**
 * Normalises any T&T phone number format to the canonical 1-868-XXX-XXXX form
 * required by the DB check constraint.
 *
 * Accepted inputs (non-exhaustive):
 *   18681234567   → 1-868-123-4567
 *   1-868-123-4567 → 1-868-123-4567
 *   8681234567    → 1-868-123-4567
 *   868-123-4567  → 1-868-123-4567
 *   1234567       → 1-868-123-4567  (7-digit local, 868 area code assumed)
 *
 * Returns null when the input cannot be mapped to a valid T&T number.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  // 11 digits: country code 1 + area code 868 + 7-digit local
  if (digits.length === 11 && digits.startsWith('1868')) {
    const local = digits.slice(4)
    return `1-868-${local.slice(0, 3)}-${local.slice(3)}`
  }
  // 10 digits: area code 868 + 7-digit local
  if (digits.length === 10 && digits.startsWith('868')) {
    const local = digits.slice(3)
    return `1-868-${local.slice(0, 3)}-${local.slice(3)}`
  }
  // 7 digits: local number only — assume T&T 868 area code
  if (digits.length === 7) {
    return `1-868-${digits.slice(0, 3)}-${digits.slice(3)}`
  }

  return null
}

/**
 * Converts a canonical T&T phone (1-868-XXX-XXXX) to the digits-only format
 * required by wa.me links: 18681234567
 */
export function phoneToWaMe(canonical: string): string {
  return canonical.replace(/\D/g, '')
}
