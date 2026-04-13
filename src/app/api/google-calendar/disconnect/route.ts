import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'
import { removeTokens } from '@/lib/googleCalendar'

/**
 * POST /api/google-calendar/disconnect
 * Disconnect Google Calendar for the authenticated pro (deletes stored tokens).
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const proId = decoded.uid

    await removeTokens(proId)

    console.log(`[Google Calendar] Disconnected for pro ${proId}`)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Google Calendar Disconnect] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 },
    )
  }
}
