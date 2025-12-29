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
      console.error('[Client Status] Session error:', e)
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

    const { searchParams } = new URL(request.url)
    const clientEmail = searchParams.get('email')

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'email est requis' },
        { status: 400 }
      )
    }

    // Chercher le profil client par email
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('email', '==', clientEmail.trim().toLowerCase())
      .where('role', '==', 'client')
      .get()

    if (profilesSnapshot.empty) {
      return NextResponse.json({
        clientId: null,
        isBlocked: false,
      })
    }

    const clientDoc = profilesSnapshot.docs[0]
    const clientData = clientDoc.data()

    // Vérifier si le client est bloqué pour ce professionnel spécifique
    const blockedPros = clientData?.blockedPros || {}
    const isBlockedForThisPro = blockedPros[user.uid] === true

    return NextResponse.json({
      clientId: clientDoc.id,
      isBlocked: isBlockedForThisPro,
    })
  } catch (error: any) {
    console.error('[Client Status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du statut' },
      { status: 500 }
    )
  }
}

