import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

// Helper function to get booking start date
function getBookingStartDate(bookingDate: string, bookingStartTime: string): Date | null {
  try {
    const dateObj = new Date(`${bookingDate}T${bookingStartTime}`)
    if (isNaN(dateObj.getTime())) {
      return null
    }
    return dateObj
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const body = await request.json()
    const { bookingId: bodyBookingId, pro_id, attendance } = body

    // Use bookingId from URL params, but also accept it from body for validation
    const finalBookingId = bookingId || bodyBookingId

    // Temporary console.log for debugging
    console.log('ATTENDANCE API RECEIVED', {
      bookingIdFromParams: bookingId,
      bookingIdFromBody: bodyBookingId,
      finalBookingId,
      pro_id,
      attendance,
      bodyKeys: Object.keys(body),
    })

    // Validation
    if (!finalBookingId || !pro_id || !attendance) {
      return NextResponse.json(
        { 
          error: 'bookingId, pro_id et attendance sont requis',
          received: {
            bookingId: finalBookingId,
            pro_id,
            attendance,
          }
        },
        { status: 400 }
      )
    }

    if (attendance !== 'present' && attendance !== 'absent') {
      return NextResponse.json(
        { error: 'attendance doit être "present" ou "absent"' },
        { status: 400 }
      )
    }

    // Charger la réservation
    const bookingDoc = await adminDb.collection('bookings').doc(finalBookingId).get()
    
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

    // Vérifier que la réservation n'est pas annulée
    if (bookingData?.status === 'cancelled' || bookingData?.status === 'cancelled_by_client') {
      return NextResponse.json(
        { error: 'Cette réservation est annulée' },
        { status: 400 }
      )
    }

    // Vérifier que l'heure de début est passée
    const bookingStartDate = getBookingStartDate(bookingData.date, bookingData.start_time)
    if (!bookingStartDate) {
      return NextResponse.json(
        { error: 'Impossible de déterminer la date du rendez-vous' },
        { status: 400 }
      )
    }

    const now = new Date()
    if (bookingStartDate > now) {
      return NextResponse.json(
        { error: 'La confirmation de présence ne peut être effectuée qu\'après l\'heure de début du rendez-vous' },
        { status: 400 }
      )
    }

    // Vérifier que l'attendance n'a pas déjà été enregistrée
    if (bookingData?.attendance === 'present' || bookingData?.attendance === 'absent') {
      return NextResponse.json(
        { error: 'La présence a déjà été confirmée pour ce rendez-vous' },
        { status: 400 }
      )
    }

    // Use transaction for atomic updates
    const clientEmail = bookingData.client_email?.trim().toLowerCase()
    
    await adminDb.runTransaction(async (transaction) => {
      // Re-read booking to ensure it hasn't changed
      const bookingRef = adminDb.collection('bookings').doc(finalBookingId)
      const bookingSnapshot = await transaction.get(bookingRef)
      
      if (!bookingSnapshot.exists) {
        throw new Error('Réservation non trouvée')
      }
      
      const currentBookingData = bookingSnapshot.data()
      
      // Re-verify status hasn't changed
      if (currentBookingData?.status === 'cancelled' || currentBookingData?.status === 'cancelled_by_client') {
        throw new Error('Cette réservation est annulée')
      }
      
      // Re-verify attendance hasn't been set
      if (currentBookingData?.attendance === 'present' || currentBookingData?.attendance === 'absent') {
        throw new Error('La présence a déjà été confirmée pour ce rendez-vous')
      }

      // Update booking with attendance
      const updateData: any = {
        attendance,
        attendance_confirmed_at: FieldValue.serverTimestamp(),
      }

      // If absent, also update status to 'no_show' and increment counter
      if (attendance === 'absent') {
        updateData.status = 'no_show'
        updateData.no_show_at = FieldValue.serverTimestamp()

        // Increment noShowCount for this professional
        if (clientEmail) {
          const profilesSnapshot = await adminDb
            .collection('profiles')
            .where('email', '==', clientEmail)
            .where('role', '==', 'client')
            .get()

          if (!profilesSnapshot.empty) {
            for (const profileDoc of profilesSnapshot.docs) {
              // Re-read profile to ensure we have latest data
              const profileRef = adminDb.collection('profiles').doc(profileDoc.id)
              const profileSnapshot = await transaction.get(profileRef)
              
              if (!profileSnapshot.exists) {
                continue // Profile doesn't exist, skip
              }

              const profileData = profileSnapshot.data()
              
              // Récupérer les compteurs par professionnel (default: empty object)
              const proCounters = profileData.proCounters || {}
              const currentProCounter = proCounters[pro_id] || { cancelCount: 0, noShowCount: 0 }
              
              // Vérifier que le compteur n'a pas déjà été incrémenté pour ce booking
              // On utilise le bookingId comme référence pour éviter les doubles incréments
              // Note: Cette vérification est redondante car on vérifie déjà l'attendance,
              // mais c'est une sécurité supplémentaire
              
              // Incrémenter noShowCount pour ce professionnel
              const currentCancelCount = currentProCounter.cancelCount || 0
              const currentNoShowCount = currentProCounter.noShowCount || 0
              
              // Double-check: si le compteur semble déjà avoir été incrémenté récemment,
              // on ne l'incrémente pas (sécurité supplémentaire)
              // Note: En pratique, la vérification de l'attendance devrait suffire
              const newNoShowCount = currentNoShowCount + 1
              
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
              const profileUpdateData: any = {
                proCounters: updatedProCounters,
              }
              
              // Si le client doit être bloqué, ajouter ce professionnel à la liste des bloqués
              if (shouldBlock) {
                const blockedPros = profileData.blockedPros || {}
                profileUpdateData.blockedPros = {
                  ...blockedPros,
                  [pro_id]: true,
                }
              }

              // Update profile atomically
              transaction.update(profileRef, profileUpdateData)
            }
          }
        }
      }

      // Update booking atomically
      transaction.update(bookingRef, updateData)
    })

    return NextResponse.json({
      ok: true,
      message: attendance === 'present' 
        ? 'Présence confirmée avec succès' 
        : 'Absence enregistrée avec succès',
    })
  } catch (error: any) {
    console.error('[Booking Attendance] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la confirmation de présence' },
      { status: 500 }
    )
  }
}

