import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const proId = searchParams.get('proId')

    console.log('[API /services/list] Incoming request with proId:', proId)

    if (!proId) {
      console.error('[API /services/list] Missing proId parameter')
      return NextResponse.json(
        { error: 'Missing proId' },
        { status: 400 }
      )
    }

    // Get all services for this pro
    console.log('[API /services/list] Querying services for proId:', proId)
    const servicesSnapshot = await adminDb
      .collection('services')
      .where('proId', '==', proId)
      .get()
    
    // Sort by created_at descending (client-side to avoid index requirement)
    const sortedDocs = servicesSnapshot.docs.sort((a, b) => {
      const aData = a.data()
      const bData = b.data()
      
      // Try to get timestamp in milliseconds
      let aTime = 0
      let bTime = 0
      
      if (aData.created_at?.toMillis) {
        aTime = aData.created_at.toMillis()
      } else if (aData.created_at?.toDate) {
        aTime = aData.created_at.toDate().getTime()
      } else if (aData.created_at) {
        aTime = new Date(aData.created_at).getTime() || 0
      }
      
      if (bData.created_at?.toMillis) {
        bTime = bData.created_at.toMillis()
      } else if (bData.created_at?.toDate) {
        bTime = bData.created_at.toDate().getTime()
      } else if (bData.created_at) {
        bTime = new Date(bData.created_at).getTime() || 0
      }
      
      return bTime - aTime // Descending order (newest first)
    })

    console.log('[API /services/list] Found', sortedDocs.length, 'services')

    // Debug log: show all fetched documents
    sortedDocs.forEach((doc) => {
      const data = doc.data()
      console.log('[DEBUG /api/services/list] Service document:', {
        collection: 'services',
        documentId: doc.id,
        data: data,
      })
      
      // Debug: log if proId field is missing or different
      if (!data.proId && data.pro_id) {
        console.warn('[API /services/list] Service', doc.id, 'uses pro_id instead of proId')
      }
    })

    const services = sortedDocs.map((doc) => {
      const data = doc.data()
      
      return {
        id: doc.id,
        proId: data.proId || data.pro_id, // Support both for backward compatibility
        serviceId: data.serviceId || null, // Reference to services_catalog
        name: data.name,
        description: data.description || '',
        price: data.price,
        duration: data.duration,
        isActive: data.isActive !== undefined ? data.isActive : true,
        created_at: data.created_at?.toDate?.()?.toISOString() || null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
      }
    })

    console.log('[API /services/list] Returning', services.length, 'services')
    return NextResponse.json({ services })
  } catch (error: any) {
    console.error('[API /services/list] Error listing services:', error)
    return NextResponse.json(
      { error: error.message || 'Error listing services' },
      { status: 500 }
    )
  }
}

