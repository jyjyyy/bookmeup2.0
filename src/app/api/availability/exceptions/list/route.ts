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

    // Get all exceptions for this pro
    const exceptionsSnapshot = await adminDb
      .collection('pros')
      .doc(proId)
      .collection('exceptions')
      .get()

    const exceptions = exceptionsSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          date: data.date,
          reason: data.reason || null,
          fullDay: data.fullDay !== undefined ? data.fullDay : true,
          created_at: data.created_at?.toDate?.()?.toISOString() || null,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
        }
      })
      .sort((a, b) => {
        // Sort by date ascending
        return a.date.localeCompare(b.date)
      })

    return NextResponse.json({ exceptions })
  } catch (error: any) {
    console.error('Error listing exceptions:', error)
    return NextResponse.json(
      { error: error.message || 'Error listing exceptions' },
      { status: 500 }
    )
  }
}

