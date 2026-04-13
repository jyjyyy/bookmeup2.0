import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { createCalendarEvent, getStoredTokens } from '@/lib/googleCalendar'

/**
 * POST /api/google-calendar/sync
 * Manually sync recent confirmed bookings to Google Calendar.
 * Can also be called internally after a new booking is created.
 *
 * Body (optional): { bookingId?: string }
 *   - If bookingId is provided, sync only that booking.
 *   - Otherwise sync all confirmed bookings for the pro that don't have a googleEventId yet.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const proId = decoded.uid

    // Check if connected & autoSync enabled
    const tokens = await getStoredTokens(proId)
    if (!tokens || !tokens.connected) {
      return NextResponse.json({ error: 'Google Calendar non connecté' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { bookingId } = body

    let synced = 0

    if (bookingId) {
      // Sync a single booking
      const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
      if (bookingDoc.exists) {
        const data = bookingDoc.data()!
        if (!data.googleEventId && (data.status === 'confirmed' || data.status === 'pending')) {
          const eventId = await createCalendarEvent(proId, {
            summary: `${data.serviceName || 'RDV'} — ${data.client_name || 'Client'}`,
            description: `Client : ${data.client_name || ''}\nEmail : ${data.client_email || ''}\nTéléphone : ${data.client_phone || ''}`,
            date: data.date,
            startTime: data.start_time,
            endTime: data.end_time,
            clientName: data.client_name,
            clientEmail: data.client_email,
          })
          if (eventId) {
            await adminDb.collection('bookings').doc(bookingId).update({ googleEventId: eventId })
            synced++
          }
        }
      }
    } else {
      // Sync all unsynced confirmed bookings for this pro
      // Query both pro_id and proId fields
      const queries = [
        adminDb.collection('bookings').where('pro_id', '==', proId).where('status', '==', 'confirmed').get(),
        adminDb.collection('bookings').where('proId', '==', proId).where('status', '==', 'confirmed').get(),
      ]

      const [snap1, snap2] = await Promise.all(queries)
      const seen = new Set<string>()
      const allDocs = [...snap1.docs, ...snap2.docs].filter((d) => {
        if (seen.has(d.id)) return false
        seen.add(d.id)
        return true
      })

      for (const bookingDoc of allDocs) {
        const data = bookingDoc.data()
        if (data.googleEventId) continue // already synced

        const eventId = await createCalendarEvent(proId, {
          summary: `${data.serviceName || 'RDV'} — ${data.client_name || 'Client'}`,
          description: `Client : ${data.client_name || ''}\nEmail : ${data.client_email || ''}\nTéléphone : ${data.client_phone || ''}`,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          clientName: data.client_name,
          clientEmail: data.client_email,
        })

        if (eventId) {
          await adminDb.collection('bookings').doc(bookingDoc.id).update({ googleEventId: eventId })
          synced++
        }
      }
    }

    return NextResponse.json({ ok: true, synced })
  } catch (error: any) {
    console.error('[Google Calendar Sync] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 },
    )
  }
}
