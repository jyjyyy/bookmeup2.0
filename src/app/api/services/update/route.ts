import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, name, description, price, duration, isActive } = body

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

    // Update service
    const updateData: any = {
      updated_at: FieldValue.serverTimestamp(),
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (price !== undefined) updateData.price = Number(price)
    if (duration !== undefined) updateData.duration = Number(duration)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    await serviceRef.update(updateData)

    return NextResponse.json({
      ok: true,
      message: 'Service updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: error.message || 'Error updating service' },
      { status: 500 }
    )
  }
}

