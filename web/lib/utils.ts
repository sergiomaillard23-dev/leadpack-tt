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
