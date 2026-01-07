import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proId, name, description, price, duration, serviceId } = body

    // Validation
    if (!proId || !name || price === undefined || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: proId, name, price, duration' },
        { status: 400 }
      )
    }

    // Get pro's subscription plan
    const proDoc = await adminDb.collection('pros').doc(proId).get()
    
    if (!proDoc.exists) {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      )
    }

    const proData = proDoc.data()
    const plan = proData?.plan || 'starter'

    // Check service limit for starter plan
    if (plan === 'starter') {
      const servicesSnapshot = await adminDb
        .collection('services')
        .where('proId', '==', proId)
        .get()

      if (servicesSnapshot.size >= 15) {
        return NextResponse.json(
          {
            error: 'Vous avez atteint la limite de votre abonnement Starter (15 services maximum).',
            limitReached: true,
          },
          { status: 403 }
        )
      }
    }

    // Create service
    const serviceData = {
      proId,
      name: name.trim(),
      serviceId: serviceId || null, // Reference to services_catalog
      description: description?.trim() || '',
      price: Number(price),
      duration: Number(duration),
      isActive: true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }
    
    const serviceRef = await adminDb.collection('services').add(serviceData)
    
    // Debug log: show created document
    const createdDoc = await serviceRef.get()
    console.log('[DEBUG /api/services/create] Created service document:', {
      collection: 'services',
      documentId: serviceRef.id,
      data: createdDoc.data(),
    })

    return NextResponse.json({
      ok: true,
      serviceId: serviceRef.id,
    })
  } catch (error: any) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: error.message || 'Error creating service' },
      { status: 500 }
    )
  }
}

