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

    // Helper function to check time overlap
    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    // STEP 1: Validate new slot availability BEFORE confirming modification
    // This ensures the new slot follows the same availability rules as creation
    const newStartMinutes = timeToMinutes(start_time)
    const newEndMinutes = newStartMinutes + bookingDuration

    // Check if date/time is actually changing (if not, no need to validate availability)
    const originalDate = bookingData?.date
    const originalStartTime = bookingData?.start_time
    const isDateChanging = originalDate !== date
    const isTimeChanging = originalStartTime !== start_time
    const isSlotChanging = isDateChanging || isTimeChanging

    // Only validate availability if slot is changing
    if (isSlotChanging) {
      // Load existing bookings for the new date to check availability
      const existingBookingsSnap = await adminDb
        .collection('bookings')
        .where('pro_id', '==', pro_id)
        .where('date', '==', date)
        .where('status', 'in', ['pending', 'confirmed'])
        .get()

      // Check if new slot overlaps with existing bookings (excluding current booking)
      const hasOverlap = existingBookingsSnap.docs.some((doc) => {
        if (doc.id === finalBookingId) {
          return false // Exclude current booking being modified
        }
        const existingBooking = doc.data()
        const existingStart = timeToMinutes(existingBooking.start_time)
        const existingEnd = timeToMinutes(existingBooking.end_time)
        
        // Check for overlap: new slot overlaps if:
        // - New start is before existing end AND
        // - New end is after existing start
        return newStartMinutes < existingEnd && newEndMinutes > existingStart
      })

      // If slot is not available, abort modification
      if (hasOverlap) {
        return NextResponse.json(
          { error: 'Ce créneau n\'est plus disponible.' },
          { status: 400 }
        )
      }
    }

    // ATOMIC TRANSACTION: Wrap all critical steps in a single transaction
    // This ensures:
    // 1. Release old slot (automatic when booking date/time changes)
    // 2. Reserve new slot (automatic when booking date/time is updated)
    // 3. Update booking document (atomic update)
    // If ANY step fails, everything is rolled back and booking remains unchanged
    await adminDb.runTransaction(async (transaction) => {
      // STEP 1: Read current booking state (within transaction for consistency)
      const bookingRef = adminDb.collection('bookings').doc(finalBookingId)
      const bookingSnapshot = await transaction.get(bookingRef)
      
      if (!bookingSnapshot.exists) {
        throw new Error('Réservation non trouvée')
      }
      
      const currentBookingData = bookingSnapshot.data()
      
      // Store original booking values (needed for logging and validation)
      const originalDateInTransaction = currentBookingData?.date
      const originalStartTimeInTransaction = currentBookingData?.start_time
      const originalEndTimeInTransaction = currentBookingData?.end_time
      const originalDurationInTransaction = currentBookingData?.duration || bookingDuration
      
      // Validate booking state (if this fails, transaction rolls back)
      if (currentBookingData?.status === 'cancelled' || currentBookingData?.status === 'cancelled_by_client') {
        throw new Error('Cette réservation est déjà annulée')
      }
      
      // Validate authorization (if this fails, transaction rolls back)
      const currentEmail = currentBookingData?.client_email?.trim().toLowerCase()
      if (currentEmail !== requestEmail) {
        throw new Error('Non autorisé')
      }

      // STEP 2: Check if slot is changing
      const isDateChangingInTransaction = originalDateInTransaction !== date
      const isTimeChangingInTransaction = originalStartTimeInTransaction !== start_time
      const isSlotChangingInTransaction = isDateChangingInTransaction || isTimeChangingInTransaction

      // STEP 3: Validate new slot availability (within transaction to prevent race conditions)
      // This ensures no double booking can occur even with concurrent requests
      // If this fails, transaction rolls back and booking remains unchanged
      if (isSlotChangingInTransaction) {
        // Read all bookings for the new date (within transaction for consistency)
        const bookingsInTransaction = await transaction.get(
          adminDb.collection('bookings')
            .where('pro_id', '==', pro_id)
            .where('date', '==', date)
            .where('status', 'in', ['pending', 'confirmed'])
        )

        // Check for overlaps (excluding current booking being updated)
        const hasOverlapInTransaction = bookingsInTransaction.docs.some((doc) => {
          if (doc.id === finalBookingId) {
            return false // Exclude current booking being updated
          }
          const existingBooking = doc.data()
          const existingStart = timeToMinutes(existingBooking.start_time)
          const existingEnd = timeToMinutes(existingBooking.end_time)
          return newStartMinutes < existingEnd && newEndMinutes > existingStart
        })

        // If slot is NOT available, throw error (transaction rolls back)
        if (hasOverlapInTransaction) {
          throw new Error('Ce créneau n\'est plus disponible.')
        }
      }
      
      // STEP 4: Update booking document atomically
      // This single atomic update accomplishes:
      // - Release old slot: Booking no longer exists at old date/time (automatic)
      // - Reserve new slot: Booking now exists at new date/time (automatic)
      // - Update booking document: All changes are applied atomically
      // If this fails, transaction rolls back and booking remains unchanged
      const updateData: any = {
        date,
        start_time,
        end_time,
        updated_at: FieldValue.serverTimestamp(),
      }

      // Update additional fields if provided
      if (service_id && service_id !== currentBookingData?.service_id) {
        updateData.service_id = service_id
      }
      if (client_name) {
        updateData.client_name = client_name.trim()
      }
      if (client_phone !== undefined) {
        updateData.client_phone = client_phone?.trim() || null
      }
      
      // Apply update atomically (all-or-nothing)
      // If this succeeds, old slot is released and new slot is reserved
      // If this fails, transaction rolls back and nothing changes
      transaction.update(bookingRef, updateData)

      // Log successful slot change (only if transaction succeeds)
      if (isSlotChangingInTransaction) {
        console.log('[Booking Update] Atomic slot change', {
          bookingId: finalBookingId,
          oldSlot: {
            date: originalDateInTransaction,
            start_time: originalStartTimeInTransaction,
            end_time: originalEndTimeInTransaction,
          },
          newSlot: {
            date,
            start_time,
            end_time,
          },
          message: 'Old slot released, new slot reserved atomically',
        })
      }
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

