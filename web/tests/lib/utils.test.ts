import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats 10000 cents as TT$100.00', () => {
    expect(formatCurrency(10000)).toBe('TT$100.00')
  })

  it('formats 3000 cents as TT$30.00', () => {
    expect(formatCurrency(3000)).toBe('TT$30.00')
  })

  it('formats 125050 cents as TT$1,250.50', () => {
    expect(formatCurrency(125050)).toBe('TT$1,250.50')
  })

  it('formats 0 as TT$0.00', () => {
    expect(formatCurrency(0)).toBe('TT$0.00')
  })
})
