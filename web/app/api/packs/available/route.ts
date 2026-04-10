import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAvailablePacks } from '@/lib/db/packs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const packs = await getAvailablePacks()
    return NextResponse.json({ success: true, data: packs })
  } catch (err) {
    console.error('[GET /api/packs/available]', err)
    return NextResponse.json({ success: false, error: 'Failed to load packs' }, { status: 500 })
  }
}
