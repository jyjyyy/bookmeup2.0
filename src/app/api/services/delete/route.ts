import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId } = body

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      )
    }

    // Check if service exists
    const serviceRef = adminDb.collection('services').doc(serviceId)
    const serviceDoc = await serviceRef.get()

    if (!serviceDoc.exists) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Delete service
    await serviceRef.delete()

    return NextResponse.json({
      ok: true,
      message: 'Service deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: error.message || 'Error deleting service' },
      { status: 500 }
    )
  }
}

