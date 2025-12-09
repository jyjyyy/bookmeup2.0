import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Lecture robuste des paramètres avec fallbacks
    const proId =
      searchParams.get('pro_id') ??
      searchParams.get('proId') ??
      searchParams.get('pro') ??
      null

    const serviceId =
      searchParams.get('service_id') ??
      searchParams.get('serviceId') ??
      null

    const date = searchParams.get('date')

    if (!proId || !serviceId || !date) {
      console.error('[Availability] Missing params', { proId, serviceId, date })
      return NextResponse.json(
        { error: 'Missing pro_id, service_id or date' },
        { status: 400 }
      )
    }

    // Parser la date
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0 = dimanche, 1 = lundi, etc.

    // Check for exceptional closures first
    const exceptionsQuery = query(
      collection(db, 'pros', proId, 'exceptions'),
      where('date', '==', date),
      where('fullDay', '==', true)
    )
    const exceptionsSnapshot = await getDocs(exceptionsQuery)

    if (!exceptionsSnapshot.empty) {
      console.log('[Availability] Date is fully closed due to exception:', date)
      return NextResponse.json({ slots: [] })
    }

    // Charger les disponibilités du pro pour ce jour
    const availabilityDoc = await getDoc(
      doc(db, 'pros', proId, 'availability', dayOfWeek.toString())
    )

    let slots: { start: string; end: string }[] = []
    let step = 30 // minutes

    if (availabilityDoc.exists()) {
      const availability = availabilityDoc.data()
      
      if (!availability.isEnabled) {
        // Jour désactivé
        return NextResponse.json({ slots: [] })
      }

      // NEW FORMAT: Use slots array if exists
      if (availability.slots && Array.isArray(availability.slots)) {
        slots = availability.slots
          .filter((slot: any) => slot?.start && slot?.end)
          .map((slot: any) => ({
            start: String(slot.start),
            end: String(slot.end),
          }))
      }
      // BACKWARD COMPATIBILITY: Convert old format (startTime/endTime) to slots
      else if (availability.startTime && availability.endTime) {
        console.log('[DEBUG /api/availability] Converting old format to slots')
        slots = [
          {
            start: String(availability.startTime),
            end: String(availability.endTime),
          },
        ]
      }

      step = Number(availability.step) || 30
    }

    // Si aucune plage disponible, retourner vide
    if (slots.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Charger le service pour obtenir la durée
    const serviceDoc = await getDoc(doc(db, 'services', serviceId))
    if (!serviceDoc.exists()) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 })
    }

    const serviceDuration = serviceDoc.data().duration || 30

    // Générer les créneaux depuis toutes les plages
    const timeSlots: { time: string; available: boolean }[] = []
    const now = new Date()
    const isToday = date === now.toISOString().split('T')[0]
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1

    // Pour chaque plage horaire
    for (const slot of slots) {
      const [startHour, startMin] = slot.start.split(':').map(Number)
      const [endHour, endMin] = slot.end.split(':').map(Number)

      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      // Générer les créneaux dans cette plage
      for (
        let minutes = startMinutes;
        minutes + serviceDuration <= endMinutes;
        minutes += step
      ) {
        const hour = Math.floor(minutes / 60)
        const min = minutes % 60
        const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`

        // Filtrer les créneaux passés (si aujourd'hui)
        if (isToday && minutes <= currentMinutes) {
          continue
        }

        timeSlots.push({
          time: timeString,
          available: true, // Sera mis à false si réservé
        })
      }
    }

    // Trier les créneaux par heure
    timeSlots.sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number)
      const [bHour, bMin] = b.time.split(':').map(Number)
      return aHour * 60 + aMin - (bHour * 60 + bMin)
    })

    // Charger les réservations existantes pour cette date
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('pro_id', '==', proId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    )

    const bookingsSnapshot = await getDocs(bookingsQuery)

    // Marquer les créneaux occupés comme indisponibles
    bookingsSnapshot.forEach((bookingDoc) => {
      const booking = bookingDoc.data()
      const bookingStart = booking.start_time
      const bookingEnd = booking.end_time

      timeSlots.forEach((slot) => {
        // Vérifier si le créneau chevauche avec une réservation
        const [slotHour, slotMin] = slot.time.split(':').map(Number)
        const slotStartMinutes = slotHour * 60 + slotMin
        const slotEndMinutes = slotStartMinutes + serviceDuration

        const [bookingStartHour, bookingStartMin] = bookingStart.split(':').map(Number)
        const [bookingEndHour, bookingEndMin] = bookingEnd.split(':').map(Number)
        const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin
        const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin

        // Vérifier le chevauchement
        if (
          (slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
          (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
          (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
        ) {
          slot.available = false
        }
      })
    })

    console.log('[DEBUG /api/availability] Generated', timeSlots.length, 'time slots,', timeSlots.filter(s => s.available).length, 'available')

    return NextResponse.json({ slots: timeSlots })
  } catch (error: any) {
    console.error('[Availability] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

