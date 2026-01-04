import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, catalogServiceId, description, price, duration, isActive } = body

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

    // If catalogServiceId is provided, verify it exists in catalog
    if (catalogServiceId !== undefined) {
      const catalogDoc = await adminDb.collection('services_catalog').doc(catalogServiceId).get()
      if (!catalogDoc.exists) {
        return NextResponse.json(
          { error: `Service "${catalogServiceId}" not found in catalog` },
          { status: 404 }
        )
      }
    }

    // Update service
    // Note: name is no longer stored - it's resolved from catalog via serviceId
    const updateData: any = {
      updated_at: FieldValue.serverTimestamp(),
    }

    if (catalogServiceId !== undefined) updateData.serviceId = catalogServiceId.trim()
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

