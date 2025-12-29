import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

export async function POST(request: NextRequest) {
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
      console.error('[Unblock Client] Session error:', e)
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

    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId est requis' },
        { status: 400 }
      )
    }

    // Charger le profil client
    const clientDoc = await adminDb.collection('profiles').doc(clientId).get()
    
    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    const clientData = clientDoc.data()
    
    // Vérifier que c'est bien un client
    if (clientData?.role !== 'client') {
      return NextResponse.json(
        { error: 'Ce profil n\'est pas un client' },
        { status: 400 }
      )
    }

    // Vérifier que le client est bloqué (optionnel, mais logique)
    if (clientData?.isBlocked !== true) {
      return NextResponse.json(
        { error: 'Ce client n\'est pas bloqué' },
        { status: 400 }
      )
    }

    // Débloquer et réinitialiser les compteurs
    await adminDb.collection('profiles').doc(clientId).update({
      isBlocked: false,
      cancelCount: 0,
      noShowCount: 0,
    })

    console.log('[Unblock Client] Client unblocked:', {
      clientId,
      proId: user.uid,
    })

    return NextResponse.json({
      ok: true,
      message: 'Client débloqué avec succès',
    })
  } catch (error: any) {
    console.error('[Unblock Client] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du déblocage du client' },
      { status: 500 }
    )
  }
}

