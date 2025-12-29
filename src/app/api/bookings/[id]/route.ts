import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const body = await request.json()
    const { 
      bookingId: bodyBookingId,
      pro_id, 
      service_id, 
      date, 
      start_time, 
      duration,
      client_name,
      client_email,
      client_phone 
    } = body

    // Use bookingId from URL params (primary) or from body (fallback)
    const finalBookingId = bookingId || bodyBookingId

    // TEMPORARY debug log - check if bookingId is in payload
    console.log('UPDATE BOOKING API RECEIVED', {
      bookingIdFromParams: bookingId,
      bookingIdFromBody: bodyBookingId,
      finalBookingId,
      pro_id,
      service_id,
      date,
      start_time,
      duration,
      client_email,
      bodyKeys: Object.keys(body),
      bodyBookingIdExists: !!bodyBookingId,
      bodyBookingIdValue: bodyBookingId,
      fullBody: body,
    })

    // Validation
    if (!finalBookingId || !pro_id || !service_id || !date || !start_time || !duration || !client_email) {
      return NextResponse.json(
        { 
          error: 'bookingId, pro_id, service_id, date, start_time, duration et client_email sont requis',
          received: {
            bookingId: finalBookingId,
            pro_id,
            service_id,
            date,
            start_time,
            duration,
            client_email,
          }
        },
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
    
    // Vérifier que l'email correspond (sécurité)
    const bookingEmail = bookingData?.client_email?.trim().toLowerCase()
    const requestEmail = client_email.trim().toLowerCase()
    
    if (bookingEmail !== requestEmail) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier que le pro_id correspond
    if (bookingData?.pro_id !== pro_id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier que le service_id correspond (si fourni)
    if (service_id && bookingData?.service_id !== service_id) {
      return NextResponse.json(
        { error: 'Le service ne correspond pas à la réservation' },
        { status: 400 }
      )
    }

    // Vérifier que la réservation n'est pas annulée
    if (bookingData?.status === 'cancelled' || bookingData?.status === 'cancelled_by_client') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      )
    }

    // Use provided duration or existing booking duration
    const bookingDuration = duration || bookingData?.duration || 30
    
    // Calculer la nouvelle heure de fin
    const [startHour, startMin] = start_time.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = startMinutes + bookingDuration
    const endHour = Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    const end_time = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

    // Vérifier la disponibilité du nouveau créneau (exclure le booking actuel)
    const existingBookingsSnap = await adminDb
      .collection('bookings')
      .where('pro_id', '==', pro_id)
      .where('date', '==', date)
      .where('status', 'in', ['pending', 'confirmed'])
      .get()

    // Helper function to check time overlap
    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    const newStartMinutes = timeToMinutes(start_time)
    const newEndMinutes = newStartMinutes + bookingDuration

    // Check if new slot overlaps with existing bookings (excluding current booking)
    const hasOverlap = existingBookingsSnap.docs.some((doc) => {
      if (doc.id === finalBookingId) {
        return false // Exclude current booking
      }
      const existingBooking = doc.data()
      const existingStart = timeToMinutes(existingBooking.start_time)
      const existingEnd = timeToMinutes(existingBooking.end_time)
      
      // Check for overlap
      return newStartMinutes < existingEnd && newEndMinutes > existingStart
    })

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'Ce créneau est déjà réservé. Veuillez choisir un autre horaire.' },
        { status: 400 }
      )
    }

    // Use transaction for atomic update to prevent race conditions
    await adminDb.runTransaction(async (transaction) => {
      const bookingRef = adminDb.collection('bookings').doc(finalBookingId)
      const bookingSnapshot = await transaction.get(bookingRef)
      
      if (!bookingSnapshot.exists) {
        throw new Error('Réservation non trouvée')
      }
      
      const currentBookingData = bookingSnapshot.data()
      
      // Re-verify status hasn't changed
      if (currentBookingData?.status === 'cancelled' || currentBookingData?.status === 'cancelled_by_client') {
        throw new Error('Cette réservation est déjà annulée')
      }
      
      // Re-verify email matches
      const currentEmail = currentBookingData?.client_email?.trim().toLowerCase()
      if (currentEmail !== requestEmail) {
        throw new Error('Non autorisé')
      }

      // Re-check availability in transaction (double-check)
      const bookingsInTransaction = await transaction.get(
        adminDb.collection('bookings')
          .where('pro_id', '==', pro_id)
          .where('date', '==', date)
          .where('status', 'in', ['pending', 'confirmed'])
      )

      const hasOverlapInTransaction = bookingsInTransaction.docs.some((doc) => {
        if (doc.id === finalBookingId) {
          return false
        }
        const existingBooking = doc.data()
        const existingStart = timeToMinutes(existingBooking.start_time)
        const existingEnd = timeToMinutes(existingBooking.end_time)
        return newStartMinutes < existingEnd && newEndMinutes > existingStart
      })

      if (hasOverlapInTransaction) {
        throw new Error('Ce créneau est déjà réservé. Veuillez choisir un autre horaire.')
      }
      
      // Update booking atomically
      const updateData: any = {
        date,
        start_time,
        end_time,
        updated_at: FieldValue.serverTimestamp(),
      }

      // Update service_id if provided and different
      if (service_id && service_id !== currentBookingData?.service_id) {
        updateData.service_id = service_id
      }

      // Update client info if provided
      if (client_name) {
        updateData.client_name = client_name.trim()
      }
      if (client_phone !== undefined) {
        updateData.client_phone = client_phone?.trim() || null
      }
      
      transaction.update(bookingRef, updateData)
    })

    return NextResponse.json({
      ok: true,
      message: 'Réservation modifiée avec succès',
      bookingId: finalBookingId,
    })
  } catch (error: any) {
    console.error('[Booking Update] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification de la réservation' },
      { status: 500 }
    )
  }
}

