import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

// Helper function to check if cancellation is late (<24h before booking)
function isLateCancellation(bookingDate: string, bookingStartTime: string): boolean {
  try {
    // Parse booking date and time
    const dateObj = new Date(`${bookingDate}T${bookingStartTime}`)
    if (isNaN(dateObj.getTime())) {
      return false
    }

    // Get current time
    const now = Date.now()
    const bookingStart = dateObj.getTime()
    
    // Calculate 24 hours in milliseconds
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000
    
    // Check if now >= (bookingStart - 24h)
    // This means cancellation is within 24 hours of booking
    const threshold = bookingStart - twentyFourHoursInMs
    return now >= threshold
  } catch {
    return false
  }
}

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

    // Vérifier si l'annulation est tardive (<24h avant le booking)
    const isLate = isLateCancellation(bookingData.date, bookingData.start_time)
    
    // Trouver le profil client par email
    const clientEmail = client_email.trim().toLowerCase()
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('email', '==', clientEmail)
      .where('role', '==', 'client')
      .get()

    // Use transaction for atomic updates
    if (!profilesSnapshot.empty && isLate) {
      const proId = bookingData.pro_id
      
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
          if (currentBookingData?.status === 'cancelled' || currentBookingData?.status === 'cancelled_by_client') {
            throw new Error('Cette réservation est déjà annulée')
          }

          // Update booking status
          transaction.update(bookingRef, {
            status: 'cancelled_by_client',
            cancelled_at: FieldValue.serverTimestamp(),
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
          const currentProCounter = proCounters[proId] || { cancelCount: 0, noShowCount: 0 }
          
          // Incrémenter cancelCount pour ce professionnel
          const newCancelCount = (currentProCounter.cancelCount || 0) + 1
          const currentNoShowCount = currentProCounter.noShowCount || 0
          
          // Vérifier si le client doit être bloqué pour ce professionnel (total >= 5)
          const totalAbuseCount = newCancelCount + currentNoShowCount
          const shouldBlock = totalAbuseCount >= 5

          // Mettre à jour les compteurs par professionnel
          const updatedProCounters = {
            ...proCounters,
            [proId]: {
              cancelCount: newCancelCount,
              noShowCount: currentNoShowCount,
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
              [proId]: true,
            }
          }

          // Update profile atomically
          transaction.update(profileRef, updateData)
        })
        
        console.log('[Booking Cancel] Updated client profile (atomic):', {
          clientId: profileDoc.id,
          proId: bookingData.pro_id,
          isLate,
        })
      }
    } else {
      // Early cancellation - just update booking status (no counter increment)
      await adminDb.collection('bookings').doc(bookingId).update({
        status: 'cancelled_by_client',
        cancelled_at: FieldValue.serverTimestamp(),
      })
      
      if (!isLate) {
        console.log('[Booking Cancel] Early cancellation (>24h), no counter increment:', {
          bookingId,
          clientEmail,
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

