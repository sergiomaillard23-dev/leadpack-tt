import { describe, it, expect } from 'vitest'
import {
  calculateLeadStats,
  calculateLeadOVR,
  applyLegendaryGate,
  getLeadTier,
} from '@/lib/utils/scoring'

describe('calculateLeadStats + calculateLeadOVR', () => {
  it('returns OVR >= 90 for a high-value T&T lead', () => {
    // $30k income + Government + Westmoorings + fresh quote_request + age 38
    const stats = calculateLeadStats({
      hoursSinceGenerated: 1,
      intentSource: 'quote_request',
      parish: 'Westmoorings',
      monthlyIncomeTTD: 30000,
      employerType: 'Government',
      age: 38,
    })
    const ovr = calculateLeadOVR(stats)
    expect(ovr).toBeGreaterThanOrEqual(90)
  })

  it('returns tier BRONZE for a low-income lead', () => {
    const stats = calculateLeadStats({
      hoursSinceGenerated: 96,
      intentSource: 'unknown',
      parish: 'Sangre Grande',
      monthlyIncomeTTD: 6000,
      employerType: 'Unknown',
      age: 55,
    })
    const ovr = calculateLeadOVR(stats)
    expect(getLeadTier(ovr)).toBe('BRONZE')
  })
})

describe('applyLegendaryGate', () => {
  it('demotes a lead with high average OVR but low FIN below LEGENDARY threshold', () => {
    // High average but low FIN — should be demoted to 89
    const stats = calculateLeadStats({
      hoursSinceGenerated: 1,       // FRH = 100
      intentSource: 'quote_request', // INT = 95
      parish: 'Westmoorings',        // LOC = 100
      monthlyIncomeTTD: 5000,        // FIN = 50 (low — fails gate)
      employerType: 'Government',    // STA = 95
      age: 38,                       // FIT = 100
    })
    const rawOvr = calculateLeadOVR(stats)
    const gatedOvr = applyLegendaryGate(rawOvr, stats)

    // If the raw OVR reached >= 90, the gate must demote it to 89
    if (rawOvr >= 90) {
      expect(gatedOvr).toBe(89)
      expect(getLeadTier(gatedOvr)).toBe('GOLD')
    } else {
      // If raw OVR was already below 90, gate changes nothing
      expect(gatedOvr).toBe(rawOvr)
    }
  })

  it('demotes a lead with high average OVR but low FRH below LEGENDARY threshold', () => {
    const stats = calculateLeadStats({
      hoursSinceGenerated: 96,       // FRH = 30 (stale — fails gate)
      intentSource: 'quote_request', // INT = 95
      parish: 'Westmoorings',        // LOC = 100
      monthlyIncomeTTD: 30000,       // FIN = 100
      employerType: 'Government',    // STA = 95
      age: 38,                       // FIT = 100
    })
    const rawOvr = calculateLeadOVR(stats)
    const gatedOvr = applyLegendaryGate(rawOvr, stats)

    if (rawOvr >= 90) {
      expect(gatedOvr).toBe(89)
    } else {
      expect(gatedOvr).toBe(rawOvr)
    }
  })
})

describe('getLeadTier', () => {
  it('returns correct tier for boundary values', () => {
    expect(getLeadTier(90)).toBe('LEGENDARY')
    expect(getLeadTier(89)).toBe('GOLD')
    expect(getLeadTier(80)).toBe('GOLD')
    expect(getLeadTier(79)).toBe('SILVER')
    expect(getLeadTier(70)).toBe('SILVER')
    expect(getLeadTier(69)).toBe('BRONZE')
    expect(getLeadTier(0)).toBe('BRONZE')
  })
})
