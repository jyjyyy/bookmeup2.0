import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification pro
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')?.value || null
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    let user = null
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie)
      user = decoded
    } catch (e) {
      console.error('[Blocked Clients] Session error:', e)
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est un pro
    const proDoc = await adminDb.collection('pros').doc(user.uid).get()
    if (!proDoc.exists) {
      return NextResponse.json(
        { error: 'Accès réservé aux professionnels' },
        { status: 403 }
      )
    }

    // Récupérer tous les clients bloqués
    const blockedClientsSnapshot = await adminDb
      .collection('profiles')
      .where('role', '==', 'client')
      .where('isBlocked', '==', true)
      .get()

    const blockedClients = blockedClientsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || null,
        email: data.email || null,
        cancelCount: data.cancelCount ?? 0,
        noShowCount: data.noShowCount ?? 0,
      }
    })

    return NextResponse.json({
      clients: blockedClients,
    })
  } catch (error: any) {
    console.error('[Blocked Clients] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des clients bloqués' },
      { status: 500 }
    )
  }
}

