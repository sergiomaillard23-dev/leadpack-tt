'use client'

// TODO: AI Script Generator (Phase 6 — deferred)
//
// When implementing:
// - Input: pack description (parish, avg income tier, pack type)
// - Output: 5-step calling script personalised for that batch
// - Calls POST /api/ai/script — see route stub at app/api/ai/script/route.ts
// - Model: claude-sonnet-4-6 (single response, no streaming)
// - Show loading spinner while waiting; display result in a card below
// - Pro-only: gate with isPro prop, show Upgrade CTA if false
//
// Props:
//   interface AIScriptGeneratorProps {
//     isPro: boolean
//     packDescription?: { parish: string; incomeTier: string; packType: string }
//   }

export default function AIScriptGenerator() {
  return null
}
