import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { attendance, proId } = body

    // Validation
    if (!attendance || !['present', 'absent'].includes(attendance)) {
      return NextResponse.json(
        { error: 'attendance must be "present" or "absent"' },
        { status: 400 }
      )
    }

    if (!proId) {
      return NextResponse.json(
        { error: 'proId is required' },
        { status: 400 }
      )
    }

    // Récupérer le booking
    const bookingRef = adminDb.collection('bookings').doc(id)
    const bookingDoc = await bookingRef.get()

    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const bookingData = bookingDoc.data()
    if (!bookingData) {
      return NextResponse.json({ error: 'Booking data not found' }, { status: 404 })
    }

    // Vérifier que le PRO est bien le propriétaire du booking
    const bookingProId = bookingData.proId || bookingData.pro_id
    if (!bookingProId || bookingProId !== proId) {
      return NextResponse.json(
        { error: 'Unauthorized: This booking does not belong to you' },
        { status: 403 }
      )
    }

    // Vérifier que le rendez-vous est dans le passé
    const dateValue = bookingData.date
    const startTime = bookingData.start_time || bookingData.startTime

    let bookingDateTime: Date | null = null
    if (typeof dateValue === 'string' && startTime && typeof startTime === 'string') {
      try {
        bookingDateTime = new Date(`${dateValue}T${startTime}:00`)
      } catch (e) {
        // Invalid format, try date only
        try {
          bookingDateTime = new Date(dateValue)
        } catch (e2) {
          // Skip
        }
      }
    } else if (dateValue) {
      if (dateValue instanceof Date) {
        bookingDateTime = dateValue
      } else if (typeof dateValue === 'object' && 'toDate' in dateValue) {
        bookingDateTime = (dateValue as any).toDate()
      }
    }

    const now = new Date()
    if (!bookingDateTime || bookingDateTime.getTime() >= now.getTime()) {
      return NextResponse.json(
        { error: 'Cannot update attendance for future appointments' },
        { status: 400 }
      )
    }

    // Mettre à jour l'attendance
    await bookingRef.update({
      attendance,
      updated_at: new Date(),
    })

    return NextResponse.json({ success: true, attendance })
  } catch (error: any) {
    console.error('[API /bookings/[id]/attendance] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
