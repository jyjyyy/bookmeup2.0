import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

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

    // 1. Charger le service pour obtenir la durée
    const serviceSnap = await adminDb.collection('services').doc(serviceId).get()
    if (!serviceSnap.exists) {
      console.error('[Availability] Service not found', { serviceId })
      return NextResponse.json({ slots: [] })
    }

    const service = serviceSnap.data()
    const serviceDuration = service?.duration ?? 30

    // 2. Calculer le jour de la semaine
    // Firestore utilise la même convention que Date.getDay():
    // 0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
    // Interpréter la date en heure locale pour éviter les problèmes de timezone
    const [year, month, day] = date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const jsDay = dateObj.getDay()
    // Mapping direct: jsDay correspond déjà à l'index Firestore
    const dayOfWeek = jsDay
    const dayKey = String(dayOfWeek)
    
    console.log('[Availability] date=', date, 'jsDay=', jsDay, 'dayOfWeek=', dayOfWeek)

    // 3. Vérifier les exceptions de fermeture (full day)
    const exceptionsSnap = await adminDb
      .collection('pros')
      .doc(proId)
      .collection('exceptions')
      .where('date', '==', date)
      .where('fullDay', '==', true)
      .get()

    if (!exceptionsSnap.empty) {
      console.log('[Availability] Date is fully closed due to exception:', date)
      return NextResponse.json({ slots: [] })
    }

    // 4. Charger les disponibilités du pro pour ce jour
    const availSnap = await adminDb
      .collection('pros')
      .doc(proId)
      .collection('availability')
      .doc(dayKey)
      .get()

    if (!availSnap.exists) {
      console.log('[Availability] No availability document for day', dayKey)
      return NextResponse.json({ slots: [] })
    }

    const avail = availSnap.data()

    if (avail?.isEnabled === false) {
      console.log('[Availability] Day is disabled', dayKey)
      return NextResponse.json({ slots: [] })
    }

    // Extraire les plages horaires (slots)
    let slots: { start: string; end: string }[] = []

    // Format nouveau : slots array
    if (avail?.slots && Array.isArray(avail.slots)) {
      slots = avail.slots
        .filter((slot: any) => slot?.start && slot?.end)
        .map((slot: any) => ({
          start: String(slot.start),
          end: String(slot.end),
        }))
    }
    // Format ancien : startTime/endTime → convertir en un seul slot
    else if (avail?.startTime && avail?.endTime) {
      console.log('[Availability] Converting old format to slots')
      slots = [
        {
          start: String(avail.startTime),
          end: String(avail.endTime),
        },
      ]
    }

    if (slots.length === 0) {
      console.log('[Availability] No time slots configured for day', dayKey)
      return NextResponse.json({ slots: [] })
    }

    // Extraire le step (intervalle entre créneaux) depuis la config de disponibilité
    const step = avail?.step ?? 30

    // 5. Charger les réservations existantes
    const bookingsSnap = await adminDb
      .collection('bookings')
      .where('pro_id', '==', proId)
      .where('date', '==', date)
      .where('status', 'in', ['pending', 'confirmed'])
      .get()

    // Convertir les bookings en intervalles en minutes
    const bookingIntervals = bookingsSnap.docs.map((doc) => {
      const booking = doc.data()
      return {
        start: timeToMinutes(booking.start_time),
        end: timeToMinutes(booking.end_time),
      }
    })

    // 6. Générer les créneaux
    const timeSlots: { time: string; available: boolean }[] = []
    const now = new Date()
    const isToday = date === now.toISOString().split('T')[0]
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1

    for (const slot of slots) {
      const start = timeToMinutes(slot.start)
      const end = timeToMinutes(slot.end)

      for (let t = start; t + serviceDuration <= end; t += step) {
        // Filtrer les créneaux passés (si aujourd'hui)
        if (isToday && t <= currentMinutes) {
          continue
        }

        const time = minutesToTime(t)
        const slotStartMinutes = t
        const slotEndMinutes = t + serviceDuration

        // Vérifier si le créneau chevauche avec une réservation
        const overlaps = bookingIntervals.some((booking) => {
          // Il y a chevauchement si :
          // - Le début du créneau est avant la fin de la réservation ET
          // - La fin du créneau est après le début de la réservation
          return slotStartMinutes < booking.end && slotEndMinutes > booking.start
        })

        timeSlots.push({
          time,
          available: !overlaps,
        })
      }
    }

    // Trier les créneaux par heure
    timeSlots.sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number)
      const [bHour, bMin] = b.time.split(':').map(Number)
      return aHour * 60 + aMin - (bHour * 60 + bMin)
    })

    console.log(
      '[Availability] Generated',
      timeSlots.length,
      'time slots,',
      timeSlots.filter((s) => s.available).length,
      'available'
    )

    return NextResponse.json({ slots: timeSlots })
  } catch (error: any) {
    console.error('[Availability] Internal error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
