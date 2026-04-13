import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'
import { generateAuthUrl } from '@/lib/googleCalendar'

/**
 * GET /api/google-calendar/auth-url
 * Returns the Google OAuth consent URL for the authenticated pro.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const proId = decoded.uid

    const url = generateAuthUrl(proId)
    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('[Google Calendar Auth URL] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 },
    )
  }
}
