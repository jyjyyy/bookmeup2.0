import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export type SearchService = {
  id: string
  name: string
  price: number | null
  duration: number | null
}

export type SearchPro = {
  id: string
  slug: string | null
  business_name: string
  city: string | null
  cityName?: string | null
  cityId?: string | null
  location?: {
    lat: number
    lng: number
  } | null
  plan: 'starter' | 'pro' | 'premium' | null
  show_in_search: boolean
  services: SearchService[]
  distance?: number // Distance in km (added client-side)
}

export async function GET(request: NextRequest) {
  try {
    console.log('[API /pros/search] Starting search...')

    // Load services catalog once for name resolution
    const catalogRef = adminDb.collection('services_catalog')
    const catalogDocs = await catalogRef.get()
    const catalogMap = new Map<string, any>()
    catalogDocs.docs.forEach((doc) => {
      catalogMap.set(doc.id, doc.data())
    })

    // Get all pros with show_in_search: true
    const prosSnapshot = await adminDb
      .collection('pros')
      .where('show_in_search', '==', true)
      .get()

    console.log('[API /pros/search] Found', prosSnapshot.docs.length, 'pros with show_in_search=true')

    const pros: SearchPro[] = []

    // For each pro, load their active services
    for (const proDoc of prosSnapshot.docs) {
      const proData = proDoc.data()
      const proId = proDoc.id

      // Get business_name with fallbacks
      let business_name = proData.business_name || proData.name || 'Professionnel beauté'

      // Get profile for name fallback
      try {
        const profileDoc = await adminDb.collection('profiles').doc(proId).get()
        if (profileDoc.exists()) {
          const profileData = profileDoc.data()
          if (profileData?.name && !proData.business_name) {
            business_name = profileData.name
          }
        }
      } catch (error) {
        // Ignore profile fetch errors, use business_name
      }

      // Load active services for this pro
      const servicesSnapshot = await adminDb
        .collection('services')
        .where('proId', '==', proId)
        .get()

      const services: SearchService[] = []

      servicesSnapshot.forEach((serviceDoc) => {
        const serviceData = serviceDoc.data()

        // Only include active services
        if (serviceData.isActive !== false) {
          // Get price (support price_cents or price)
          let price: number | null = null
          if (serviceData.price !== undefined && serviceData.price !== null) {
            price = Number(serviceData.price)
          } else if (serviceData.price_cents !== undefined && serviceData.price_cents !== null) {
            price = Number(serviceData.price_cents) / 100
          }

          // Resolve service name from catalog
          // Support both old format (name) and new format (serviceId)
          const serviceId = serviceData.serviceId || null
          let serviceName = serviceData.name || 'Service'
          
          if (serviceId) {
            const catalogData = catalogMap.get(serviceId)
            if (catalogData) {
              serviceName = catalogData.name
            }
          }

          services.push({
            id: serviceDoc.id,
            name: serviceName,
            price,
            duration: serviceData.duration !== undefined ? Number(serviceData.duration) : null,
          })
        }
      })

      pros.push({
        id: proId,
        slug: proData.slug || null,
        business_name,
        city: proData.city || proData.cityName || null,
        cityName: proData.cityName || proData.city || null,
        cityId: proData.cityId || null,
        location: proData.location || null,
        plan: (proData.plan as 'starter' | 'pro' | 'premium') || 'starter',
        show_in_search: Boolean(proData.show_in_search),
        services,
      })
    }

    // Sort by plan (premium > pro > starter) then by business_name
    const planOrder = { premium: 0, pro: 1, starter: 2 }
    pros.sort((a, b) => {
      const orderA = planOrder[a.plan || 'starter']
      const orderB = planOrder[b.plan || 'starter']
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return (a.business_name || '').localeCompare(b.business_name || '')
    })

    const totalServices = pros.reduce((sum, pro) => sum + pro.services.length, 0)
    console.log('[API /pros/search] Returning', pros.length, 'pros with', totalServices, 'total services')

    return NextResponse.json<{ pros: SearchPro[] }>({ pros })
  } catch (error: any) {
    console.error('[API /pros/search] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error searching pros' },
      { status: 500 }
    )
  }
}
