// TODO: AI Script Generator API route (Phase 6 — deferred)
//
// POST /api/ai/script
// Body: { parish: string, incomeTier: string, packType: string }
// Returns: { success: true, data: { script: string } }
//
// Implementation notes:
// - Validate session via Supabase Auth; reject non-Pro agents with 403
// - Call Anthropic API (claude-sonnet-4-6), single response — no streaming
// - Requires ANTHROPIC_API_KEY in .env.local
// - Add ANTHROPIC_API_KEY to .env.local.example when implementing
//
// System prompt:
//   "You are an expert insurance sales coach for the Trinidad and Tobago market.
//    Generate a 5-step phone calling script for an insurance agent contacting leads
//    from a specific pack. Be direct, use local T&T context (Carnival, TTEC, NHS,
//    government jobs, etc.). Keep each step to 2 sentences max. Return plain text only."

export async function POST() {
  return Response.json(
    { success: false, error: 'AI Script Generator not yet implemented.' },
    { status: 501 }
  )
}
