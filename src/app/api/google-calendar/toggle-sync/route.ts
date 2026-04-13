import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'
import { setAutoSync, getStoredTokens } from '@/lib/googleCalendar'

/**
 * POST /api/google-calendar/toggle-sync
 * Toggle auto-sync on/off for the authenticated pro.
 * Body: { enabled: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const proId = decoded.uid

    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled (boolean) requis' }, { status: 400 })
    }

    // Verify connection exists
    const tokens = await getStoredTokens(proId)
    if (!tokens || !tokens.connected) {
      return NextResponse.json({ error: 'Google Calendar non connecté' }, { status: 400 })
    }

    await setAutoSync(proId, enabled)

    return NextResponse.json({ ok: true, autoSync: enabled })
  } catch (error: any) {
    console.error('[Google Calendar Toggle Sync] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 },
    )
  }
}
