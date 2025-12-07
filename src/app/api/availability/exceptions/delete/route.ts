import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proId, exceptionId } = body

    // Validation
    if (!proId || !exceptionId) {
      return NextResponse.json(
        { error: 'proId and exceptionId are required' },
        { status: 400 }
      )
    }

    // Check if exception exists
    const exceptionRef = adminDb
      .collection('pros')
      .doc(proId)
      .collection('exceptions')
      .doc(exceptionId)

    const exceptionDoc = await exceptionRef.get()

    if (!exceptionDoc.exists) {
      return NextResponse.json(
        { error: 'Exception not found' },
        { status: 404 }
      )
    }

    // Delete exception
    await exceptionRef.delete()

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error deleting exception:', error)
    return NextResponse.json(
      { error: error.message || 'Error deleting exception' },
      { status: 500 }
    )
  }
}

