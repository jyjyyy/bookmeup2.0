import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'
import { getStoredTokens } from '@/lib/googleCalendar'

/**
 * GET /api/google-calendar/status
 * Returns the Google Calendar connection status for the authenticated pro.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const proId = decoded.uid

    const tokens = await getStoredTokens(proId)

    if (!tokens || !tokens.connected) {
      return NextResponse.json({
        connected: false,
        autoSync: false,
      })
    }

    return NextResponse.json({
      connected: true,
      googleEmail: tokens.googleEmail,
      autoSync: tokens.autoSync ?? false,
    })
  } catch (error: any) {
    console.error('[Google Calendar Status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 },
    )
  }
}
