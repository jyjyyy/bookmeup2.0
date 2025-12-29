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

    // Récupérer tous les clients et filtrer ceux bloqués pour ce professionnel
    const clientsSnapshot = await adminDb
      .collection('profiles')
      .where('role', '==', 'client')
      .get()

    const blockedClients = clientsSnapshot.docs
      .filter((doc) => {
        const data = doc.data()
        const blockedPros = data.blockedPros || {}
        return blockedPros[user.uid] === true
      })
      .map((doc) => {
        const data = doc.data()
        const proCounters = data.proCounters || {}
        const proCounter = proCounters[user.uid] || { cancelCount: 0, noShowCount: 0 }
        return {
          id: doc.id,
          name: data.name || null,
          email: data.email || null,
          cancelCount: proCounter.cancelCount || 0,
          noShowCount: proCounter.noShowCount || 0,
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

