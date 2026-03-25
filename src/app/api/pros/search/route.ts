import { NextRequest, NextResponse } from 'next/server'
import { FieldPath } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebaseAdmin'
import { getCatalogCached } from '@/lib/catalogCache'

export type SearchService = {
  id: string
  name: string
  price: number | null
  duration: number | null
  serviceId?: string | null // Reference to services_catalog
}

export type SearchPro = {
  id: string
  slug: string | null
  business_name: string
  city: string | null
  plan: 'starter' | 'pro' | 'premium' | null
  show_in_search: boolean
  services: SearchService[]
}

const CHUNK_SIZE = 10 // Firestore "in" limit
const SEARCH_CACHE_TTL_MS = 15000 // 15 secondes

type ResolvedEntry = { ts: number; data: { pros: SearchPro[] } }
type InFlightEntry = { ts: number; promise: Promise<{ pros: SearchPro[] }> }
type ProsSearchCacheEntry = ResolvedEntry | InFlightEntry

function isResolved(entry: ProsSearchCacheEntry): entry is ResolvedEntry {
  return 'data' in entry
}

declare global {
  var __prosSearchCache: Map<string, ProsSearchCacheEntry> | undefined
}

if (!globalThis.__prosSearchCache) {
  globalThis.__prosSearchCache = new Map()
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function fetchProfilesChunks(
  proIds: string[]
): Promise<Map<string, { name?: string }>> {
  const profilesByProId = new Map<string, { name?: string }>()
  const profileChunks = chunk(proIds, CHUNK_SIZE)
  for (const chunkIds of profileChunks) {
    const profilesSnap = await adminDb
      .collection('profiles')
      .where(FieldPath.documentId(), 'in', chunkIds)
      .get()
    profilesSnap.docs.forEach((doc) => {
      const d = doc.data()
      profilesByProId.set(doc.id, { name: d?.name })
    })
  }
  return profilesByProId
}

async function fetchServicesChunks(
  proIds: string[]
): Promise<Map<string, SearchService[]>> {
  const servicesByProId = new Map<string, SearchService[]>()
  const serviceChunks = chunk(proIds, CHUNK_SIZE)
  for (const chunkIds of serviceChunks) {
    const servicesSnap = await adminDb
      .collection('services')
      .where('proId', 'in', chunkIds)
      .get()

    servicesSnap.docs.forEach((serviceDoc) => {
      const serviceData = serviceDoc.data()
      if (serviceData.isActive === false) return

      let price: number | null = null
      if (serviceData.price !== undefined && serviceData.price !== null) {
        price = Number(serviceData.price)
      } else if (
        serviceData.price_cents !== undefined &&
        serviceData.price_cents !== null
      ) {
        price = Number(serviceData.price_cents) / 100
      }

      const service: SearchService = {
        id: serviceDoc.id,
        name: serviceData.name || 'Service',
        price,
        duration:
          serviceData.duration !== undefined
            ? Number(serviceData.duration)
            : null,
        serviceId: serviceData.serviceId || null,
      }

      const proId = serviceData.proId
      if (!servicesByProId.has(proId)) {
        servicesByProId.set(proId, [])
      }
      servicesByProId.get(proId)!.push(service)
    })
  }
  return servicesByProId
}

async function executeSearch(): Promise<{ pros: SearchPro[] }> {
  const t0 = Date.now()

  const prosSnapshot = await adminDb
    .collection('pros')
    .where('show_in_search', '==', true)
    .get()
  console.log(`[PERF API] fetch pros ${Date.now() - t0}ms`)

  const proIds = prosSnapshot.docs.map((d) => d.id)
  if (proIds.length === 0) {
    console.log(`[PERF API] total ${Date.now() - t0}ms`)
    return { pros: [] }
  }

  const tParallel = Date.now()
  const [profilesByProId, servicesByProId] = await Promise.all([
    fetchProfilesChunks(proIds),
    fetchServicesChunks(proIds),
  ])
  console.log(`[PERF API] fetch profiles+services (parallel) ${Date.now() - tParallel}ms`)

  const tCatalog = Date.now()
  const { nameById } = await getCatalogCached()
  console.log(`[PERF API] catalog ${Date.now() - tCatalog}ms`)

  const pros: SearchPro[] = prosSnapshot.docs.map((proDoc) => {
    const proData = proDoc.data()
    const proId = proDoc.id

    let business_name =
      proData.business_name || proData.name || 'Professionnel beauté'
    const profile = profilesByProId.get(proId)
    if (profile?.name && !proData.business_name) {
      business_name = profile.name
    }

    const rawServices = servicesByProId.get(proId) || []
    const services: SearchService[] = rawServices.map((s) => ({
      ...s,
      name: s.serviceId
        ? nameById.get(s.serviceId) || s.name
        : s.name,
    }))

    return {
      id: proId,
      slug: proData.slug || null,
      business_name,
      city: proData.city || null,
      plan: (proData.plan as 'starter' | 'pro' | 'premium') || 'starter',
      show_in_search: Boolean(proData.show_in_search),
      services,
    }
  })

  const planOrder = { premium: 0, pro: 1, starter: 2 }
  pros.sort((a, b) => {
    const orderA = planOrder[a.plan || 'starter']
    const orderB = planOrder[b.plan || 'starter']
    if (orderA !== orderB) return orderA - orderB
    return (a.business_name || '').localeCompare(b.business_name || '')
  })

  console.log(`[PERF API] total ${Date.now() - t0}ms`)
  const totalServices = pros.reduce((sum, p) => sum + p.services.length, 0)
  console.log(
    '[API /pros/search] Returning',
    pros.length,
    'pros with',
    totalServices,
    'total services'
  )

  return { pros }
}

export async function GET(request: NextRequest) {
  const cache = globalThis.__prosSearchCache!
  const url = request.nextUrl
  const q = url.searchParams.get('q') ?? ''
  const cityId = url.searchParams.get('cityId') ?? ''
  const serviceId = url.searchParams.get('serviceId') ?? ''
  const limit = url.searchParams.get('limit') ?? ''
  const cacheKey = JSON.stringify({ q, cityId, serviceId, limit })

  try {
    const now = Date.now()
    const entry = cache.get(cacheKey)

    if (entry) {
      if (isResolved(entry) && now - entry.ts < SEARCH_CACHE_TTL_MS) {
        console.log('[SEARCH] cache HIT')
        return NextResponse.json<{ pros: SearchPro[] }>(entry.data)
      }
      if (!isResolved(entry)) {
        console.log('[SEARCH] cache INFLIGHT')
        const result = await entry.promise
        return NextResponse.json<{ pros: SearchPro[] }>(result)
      }
    }

    console.log('[SEARCH] cache MISS')
    const promise = executeSearch()
    cache.set(cacheKey, { ts: now, promise })

    const result = await promise
    cache.set(cacheKey, { ts: Date.now(), data: result })
    return NextResponse.json<{ pros: SearchPro[] }>(result)
  } catch (error: any) {
    cache.delete(cacheKey)
    console.error('[API /pros/search] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error searching pros' },
      { status: 500 }
    )
  }
}
