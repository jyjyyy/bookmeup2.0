import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const proId = searchParams.get('proId')

    if (!proId) {
      return NextResponse.json(
        { error: 'proId is required' },
        { status: 400 }
      )
    }

    // Helper function to detect mode from slots
    const detectMode = (slots: { start: string; end: string }[]): 'full' | 'pause' | 'custom' => {
      if (slots.length === 0) return 'custom'
      if (slots.length === 1) return 'full'
      if (slots.length === 2) {
        // Check if it's a lunch break pattern (first end < second start)
        const [first, second] = slots
        const [firstEndHour, firstEndMin] = first.end.split(':').map(Number)
        const [secondStartHour, secondStartMin] = second.start.split(':').map(Number)
        const firstEndMinutes = firstEndHour * 60 + firstEndMin
        const secondStartMinutes = secondStartHour * 60 + secondStartMin
        
        if (firstEndMinutes < secondStartMinutes) {
          return 'pause'
        }
      }
      return 'custom'
    }

    const days: Array<{
      dayOfWeek: number
      isEnabled: boolean
      mode: 'full' | 'pause' | 'custom'
      step: number
      slots: { start: string; end: string }[]
    }> = []

    // For each day of week (0 = Sunday, 6 = Saturday)
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      const dayKey = dayOfWeek.toString()
      
      try {
        const availabilityDoc = await adminDb
          .collection('pros')
          .doc(proId)
          .collection('availability')
          .doc(dayKey)
          .get()

        if (availabilityDoc.exists) {
          const data = availabilityDoc.data()
          
          // Debug log: show fetched availability document
          console.log('[DEBUG /api/availability/get] Availability document:', {
            collection: 'pros/' + proId + '/availability',
            documentId: dayKey,
            data: data,
          })
          
          let slots: { start: string; end: string }[] = []
          let mode: 'full' | 'pause' | 'custom' = 'custom'
          
          // Check if mode is already stored
          if (data?.mode && ['full', 'pause', 'custom'].includes(data.mode)) {
            mode = data.mode as 'full' | 'pause' | 'custom'
          }
          
          // NEW FORMAT: Check if slots array exists
          if (data?.slots && Array.isArray(data.slots)) {
            // Validate slots structure
            slots = data.slots
              .filter((slot: any) => slot?.start && slot?.end)
              .map((slot: any) => ({
                start: String(slot.start),
                end: String(slot.end),
              }))
            
            // Auto-detect mode if not stored
            if (!data?.mode) {
              mode = detectMode(slots)
            }
          }
          // BACKWARD COMPATIBILITY: Convert old format (startTime/endTime) to slots
          else if (data?.startTime && data?.endTime) {
            console.log('[DEBUG /api/availability/get] Converting old format to slots for day', dayKey)
            slots = [
              {
                start: String(data.startTime),
                end: String(data.endTime),
              },
            ]
            mode = 'full'
          }

          days.push({
            dayOfWeek,
            isEnabled: data?.isEnabled !== undefined ? Boolean(data.isEnabled) : false,
            mode,
            step: Number(data?.step) || 30,
            slots,
          })
        } else {
          // Default values if document doesn't exist
          console.log('[DEBUG /api/availability/get] No document found for day', dayKey, '- using defaults')
          days.push({
            dayOfWeek,
            isEnabled: false,
            mode: 'custom',
            step: 30,
            slots: [],
          })
        }
      } catch (error) {
        // If error reading, use defaults
        console.error('[DEBUG /api/availability/get] Error reading day', dayKey, ':', error)
        days.push({
          dayOfWeek,
          isEnabled: false,
          mode: 'custom',
          step: 30,
          slots: [],
        })
      }
    }

    return NextResponse.json({ days })
  } catch (error: any) {
    console.error('Error getting availability:', error)
    return NextResponse.json(
      { error: error.message || 'Error getting availability' },
      { status: 500 }
    )
  }
}

