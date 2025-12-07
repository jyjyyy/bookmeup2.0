import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proId, date, reason } = body

    // Validation
    if (!proId || !date) {
      return NextResponse.json(
        { error: 'proId and date are required' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'date must be in format YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Check if exception already exists for this date
    const existingSnapshot = await adminDb
      .collection('pros')
      .doc(proId)
      .collection('exceptions')
      .where('date', '==', date)
      .limit(1)
      .get()

    if (!existingSnapshot.empty) {
      // Update existing exception instead of creating duplicate
      const existingDoc = existingSnapshot.docs[0]
      await existingDoc.ref.update({
        reason: reason?.trim() || null,
        fullDay: true,
        updated_at: FieldValue.serverTimestamp(),
      })

      return NextResponse.json({
        ok: true,
        exceptionId: existingDoc.id,
        message: 'Exception updated',
      })
    }

    // Create new exception
    const exceptionRef = await adminDb
      .collection('pros')
      .doc(proId)
      .collection('exceptions')
      .add({
        date,
        reason: reason?.trim() || null,
        fullDay: true,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      })

    return NextResponse.json({
      ok: true,
      exceptionId: exceptionRef.id,
    })
  } catch (error: any) {
    console.error('Error adding exception:', error)
    return NextResponse.json(
      { error: error.message || 'Error adding exception' },
      { status: 500 }
    )
  }
}

