import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Clears the Firebase session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true })

    // Clear the __session cookie by setting it to empty and expired
    response.cookies.set('__session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    console.log('[Auth Logout] Session cookie cleared')

    return response
  } catch (error: any) {
    console.error('[Auth Logout] Error clearing session cookie:', error)
    // Still return ok even if clearing cookie fails
    return NextResponse.json({ ok: true })
  }
}

