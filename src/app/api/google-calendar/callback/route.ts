import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForTokens,
  getGoogleEmail,
  saveTokens,
} from '@/lib/googleCalendar'

/**
 * GET /api/google-calendar/callback
 * Google OAuth callback — exchanges code for tokens and stores them.
 * Redirects the user back to the integrations page.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // proId
    const error = searchParams.get('error')

    if (error) {
      console.error('[Google Calendar Callback] OAuth error:', error)
      return NextResponse.redirect(
        new URL('/dashboard/integrations/google-calendar?error=oauth_denied', request.url),
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations/google-calendar?error=missing_params', request.url),
      )
    }

    const proId = state

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get Google email
    const googleEmail = await getGoogleEmail(tokens.access_token)

    // Store tokens in Firestore
    await saveTokens(proId, tokens, googleEmail)

    console.log(`[Google Calendar] Connected for pro ${proId} (${googleEmail})`)

    return NextResponse.redirect(
      new URL('/dashboard/integrations/google-calendar?success=true', request.url),
    )
  } catch (error: any) {
    console.error('[Google Calendar Callback] Error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/integrations/google-calendar?error=callback_failed', request.url),
    )
  }
}
