import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const body = await request.json()
    const { pro_id } = body

    // Validation
    if (!bookingId || !pro_id) {
      return NextResponse.json(
        { error: 'bookingId et pro_id sont requis' },
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
    
    // Vérifier que le pro_id correspond
    if (bookingData?.pro_id !== pro_id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier que la réservation n'est pas déjà marquée comme no-show
    if (bookingData?.status === 'no_show') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà marquée comme absence' },
        { status: 400 }
      )
    }

    // Trouver le profil client par email
    const clientEmail = bookingData.client_email?.trim().toLowerCase()
    if (clientEmail) {
      const profilesSnapshot = await adminDb
        .collection('profiles')
        .where('email', '==', clientEmail)
        .where('role', '==', 'client')
        .get()

      if (!profilesSnapshot.empty) {
        for (const profileDoc of profilesSnapshot.docs) {
          // Use transaction to ensure atomic updates
          await adminDb.runTransaction(async (transaction) => {
            // Re-read booking to ensure it hasn't changed
            const bookingRef = adminDb.collection('bookings').doc(bookingId)
            const bookingSnapshot = await transaction.get(bookingRef)
            
            if (!bookingSnapshot.exists) {
              throw new Error('Réservation non trouvée')
            }
            
            const currentBookingData = bookingSnapshot.data()
            if (currentBookingData?.status === 'no_show') {
              throw new Error('Cette réservation est déjà marquée comme absence')
            }

            // Update booking status
            transaction.update(bookingRef, {
              status: 'no_show',
              no_show_at: FieldValue.serverTimestamp(),
            })

            // Re-read profile to ensure we have latest data
            const profileRef = adminDb.collection('profiles').doc(profileDoc.id)
            const profileSnapshot = await transaction.get(profileRef)
            
            if (!profileSnapshot.exists) {
              return // Profile doesn't exist, skip
            }

            const profileData = profileSnapshot.data()
            
            // Récupérer les compteurs par professionnel (default: empty object)
            const proCounters = profileData.proCounters || {}
            const currentProCounter = proCounters[pro_id] || { cancelCount: 0, noShowCount: 0 }
            
            // Incrémenter noShowCount pour ce professionnel
            const currentCancelCount = currentProCounter.cancelCount || 0
            const newNoShowCount = (currentProCounter.noShowCount || 0) + 1
            
            // Vérifier si le client doit être bloqué pour ce professionnel (total >= 5)
            const totalAbuseCount = currentCancelCount + newNoShowCount
            const shouldBlock = totalAbuseCount >= 5

            // Mettre à jour les compteurs par professionnel
            const updatedProCounters = {
              ...proCounters,
              [pro_id]: {
                cancelCount: currentCancelCount,
                noShowCount: newNoShowCount,
              },
            }

            // Prepare update data
            const updateData: any = {
              proCounters: updatedProCounters,
            }
            
            // Si le client doit être bloqué, ajouter ce professionnel à la liste des bloqués
            if (shouldBlock) {
              const blockedPros = profileData.blockedPros || {}
              updateData.blockedPros = {
                ...blockedPros,
                [pro_id]: true,
              }
            }

            // Update profile atomically
            transaction.update(profileRef, updateData)
          })
          
          console.log('[Booking No-Show] Updated client profile (atomic):', {
            clientId: profileDoc.id,
            proId: pro_id,
          })
        }
      }
    } else {
      // No client email - just update booking status
      await adminDb.collection('bookings').doc(bookingId).update({
        status: 'no_show',
        no_show_at: FieldValue.serverTimestamp(),
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Absence enregistrée avec succès',
    })
  } catch (error: any) {
    console.error('[Booking No-Show] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'enregistrement de l\'absence' },
      { status: 500 }
    )
  }
}

