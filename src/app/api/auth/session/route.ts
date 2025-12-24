import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

/**
 * POST /api/auth/session
 * Creates a Firebase session cookie from an ID token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken } = body

    // Validate idToken
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid idToken' },
        { status: 400 }
      )
    }

    // Verify the ID token first
    const decodedClaims = await adminAuth.verifyIdToken(idToken)
    
    // Create session cookie with 7 days expiration
    const expiresIn = 60 * 60 * 24 * 7 * 1000 // 7 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    console.log('[Auth Session] Session cookie created for user:', decodedClaims.uid)

    // Set the session cookie
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // true in production, false in local dev
      sameSite: 'lax' as const,
      maxAge: expiresIn / 1000, // Convert to seconds
      path: '/',
    }

    const response = NextResponse.json({ ok: true })
    
    // Set the cookie
    response.cookies.set('__session', sessionCookie, cookieOptions)

    return response
  } catch (error: any) {
    console.error('[Auth Session] Error creating session cookie:', error)

    // Handle Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'ID token has expired' },
        { status: 401 }
      )
    }

    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Invalid ID token' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create session cookie' },
      { status: 500 }
    )
  }
}

