import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proId, dayOfWeek, isEnabled, slots = [], step = 30 } = body

    console.log('[DEBUG /api/availability/set] Incoming request:', {
      proId,
      dayOfWeek,
      isEnabled,
      slots,
      step,
    })

    // Validation
    if (!proId || dayOfWeek === undefined) {
      return NextResponse.json(
        { error: 'proId and dayOfWeek are required' },
        { status: 400 }
      )
    }

    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'dayOfWeek must be between 0 and 6' },
        { status: 400 }
      )
    }

    // Validate slots structure
    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { error: 'slots must be an array' },
        { status: 400 }
      )
    }

    // If enabled, validate slots
    if (isEnabled && slots.length > 0) {
      // Validate each slot
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        if (!slot.start || !slot.end) {
          return NextResponse.json(
            { error: `Slot ${i + 1}: start and end are required` },
            { status: 400 }
          )
        }

        // Validate time format (HH:mm)
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
          return NextResponse.json(
            { error: `Slot ${i + 1}: Invalid time format. Use HH:mm` },
            { status: 400 }
          )
        }

        // Validate start < end
        const [startHour, startMin] = slot.start.split(':').map(Number)
        const [endHour, endMin] = slot.end.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin

        if (startMinutes >= endMinutes) {
          return NextResponse.json(
            { error: `Slot ${i + 1}: start time must be before end time` },
            { status: 400 }
          )
        }
      }

      // Check for overlapping slots (sort by start time first)
      const sortedSlots = [...slots].sort((a, b) => {
        const [aHour, aMin] = a.start.split(':').map(Number)
        const [bHour, bMin] = b.start.split(':').map(Number)
        return aHour * 60 + aMin - (bHour * 60 + bMin)
      })

      for (let i = 1; i < sortedSlots.length; i++) {
        const prevSlot = sortedSlots[i - 1]
        const currentSlot = sortedSlots[i]

        const [prevEndHour, prevEndMin] = prevSlot.end.split(':').map(Number)
        const [currStartHour, currStartMin] = currentSlot.start.split(':').map(Number)
        const prevEndMinutes = prevEndHour * 60 + prevEndMin
        const currStartMinutes = currStartHour * 60 + currStartMin

        if (currStartMinutes < prevEndMinutes) {
          return NextResponse.json(
            {
              error: `Les plages horaires se chevauchent. Vérifiez que chaque plage se termine avant que la suivante ne commence.`,
            },
            { status: 400 }
          )
        }
      }
    }

    const dayKey = dayOfWeek.toString()

    // Prepare update data
    const updateData: any = {
      isEnabled: Boolean(isEnabled),
      step: Number(step) || 30,
      slots: isEnabled ? slots : [],
      updated_at: FieldValue.serverTimestamp(),
    }

    // Check if document exists to set created_at only on creation
    const docRef = adminDb
      .collection('pros')
      .doc(proId)
      .collection('availability')
      .doc(dayKey)

    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      updateData.created_at = FieldValue.serverTimestamp()
    }

    // Write to Firestore
    await docRef.set(updateData, { merge: true })

    // Debug log: show saved document
    const savedDoc = await docRef.get()
    console.log('[DEBUG /api/availability/set] Saved availability document:', {
      collection: 'pros/' + proId + '/availability',
      documentId: dayKey,
      data: savedDoc.data(),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[DEBUG /api/availability/set] Error setting availability:', error)
    return NextResponse.json(
      { error: error.message || 'Error setting availability' },
      { status: 500 }
    )
  }
}
