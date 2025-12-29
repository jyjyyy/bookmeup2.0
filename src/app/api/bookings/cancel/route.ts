import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, client_email } = body

    // Validation
    if (!bookingId || !client_email) {
      return NextResponse.json(
        { error: 'bookingId et client_email sont requis' },
        { status: 400 }
      )
    }

    // Charger la réservation
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    
    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    const bookingData = bookingDoc.data()
    
    // Vérifier que l'email correspond (sécurité)
    const bookingEmail = bookingData?.client_email?.trim().toLowerCase()
    const requestEmail = client_email.trim().toLowerCase()
    
    if (bookingEmail !== requestEmail) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (bookingData?.status === 'cancelled' || bookingData?.status === 'cancelled_by_client') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut de la réservation
    await adminDb.collection('bookings').doc(bookingId).update({
      status: 'cancelled_by_client',
      cancelled_at: FieldValue.serverTimestamp(),
    })

    // Trouver le profil client par email
    const clientEmail = client_email.trim().toLowerCase()
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('email', '==', clientEmail)
      .where('role', '==', 'client')
      .get()

    // Si un profil client existe, incrémenter cancelCount
    if (!profilesSnapshot.empty) {
      for (const profileDoc of profilesSnapshot.docs) {
        const profileData = profileDoc.data()
        
        // Récupérer les valeurs actuelles (default 0 si absentes)
        const currentCancelCount = profileData.cancelCount ?? 0
        const currentNoShowCount = profileData.noShowCount ?? 0
        
        // Incrémenter cancelCount
        const newCancelCount = currentCancelCount + 1
        
        // Vérifier si le client doit être bloqué (cancelCount + noShowCount >= 5)
        const totalAbuseCount = newCancelCount + currentNoShowCount
        const shouldBlock = totalAbuseCount >= 5

        // Mettre à jour le profil
        const updateData: any = {
          cancelCount: newCancelCount,
        }
        
        if (shouldBlock) {
          updateData.isBlocked = true
        }

        await adminDb.collection('profiles').doc(profileDoc.id).update(updateData)
        
        console.log('[Booking Cancel] Updated client profile:', {
          clientId: profileDoc.id,
          cancelCount: newCancelCount,
          noShowCount: currentNoShowCount,
          isBlocked: shouldBlock,
        })
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Réservation annulée avec succès',
    })
  } catch (error: any) {
    console.error('[Booking Cancel] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'annulation de la réservation' },
      { status: 500 }
    )
  }
}

