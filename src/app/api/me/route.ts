import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

/**
 * GET /api/me
 * Returns the current authenticated user information from session cookie
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')?.value || null

    if (!sessionCookie) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    // Verify session cookie
    let decodedClaims
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie)
    } catch (error) {
      console.error('[API /me] Invalid session cookie:', error)
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    // Get user profile from Firestore
    const profileDoc = await adminDb.collection('profiles').doc(decodedClaims.uid).get()

    if (!profileDoc.exists) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    const profileData = profileDoc.data()

    return NextResponse.json({
      user: {
        id: decodedClaims.uid,
        email: profileData?.email || decodedClaims.email || null,
        role: profileData?.role || 'client',
        name: profileData?.name || null,
      },
    })
  } catch (error: any) {
    console.error('[API /me] Error:', error)
    return NextResponse.json(
      { user: null },
      { status: 200 }
    )
  }
}


