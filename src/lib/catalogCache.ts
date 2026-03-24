import { adminDb } from '@/lib/firebaseAdmin'

const TTL_MS = 10 * 60 * 1000 // 10 minutes

export type CatalogItem = {
  id: string
  name: string
  category: string | null
}

export type CatalogCache = {
  services: CatalogItem[]
  nameById: Map<string, string>
  categoryById: Map<string, string>
}

type GlobalCatalogCache = {
  ts: number
  data: CatalogCache | null
  promise: Promise<CatalogCache> | null
}

declare global {
  var __catalogCache: GlobalCatalogCache | undefined
}

if (typeof globalThis.__catalogCache === 'undefined') {
  globalThis.__catalogCache = {
    ts: 0,
    data: null,
    promise: null,
  }
}

async function fetchCatalogFromFirestore(): Promise<CatalogCache> {
  const catalogSnapshot = await adminDb.collection('services_catalog').get()
  const services = catalogSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name || '',
      category: data.category || null,
    }
  })
  services.sort((a, b) => a.name.localeCompare(b.name))

  const nameById = new Map<string, string>()
  const categoryById = new Map<string, string>()
  for (const service of services) {
    nameById.set(service.id, service.name)
    if (service.category) {
      categoryById.set(service.id, service.category)
    }
  }
  return { services, nameById, categoryById }
}

export async function getCatalogCached(): Promise<CatalogCache> {
  const now = Date.now()
  const cache = globalThis.__catalogCache!

  // In-flight: une requête est déjà en cours
  if (cache.promise) {
    console.log('[CATALOG] cache INFLIGHT')
    return cache.promise
  }

  // HIT: data valide et TTL OK
  if (cache.data && now - cache.ts < TTL_MS) {
    console.log('[CATALOG] cache HIT')
    return cache.data
  }

  // MISS: créer la promise, la stocker, fetch, puis stocker data+ts et clear promise
  console.log('[CATALOG] cache MISS -> fetching Firestore')
  const promise = fetchCatalogFromFirestore()
  cache.promise = promise
  try {
    const data = await promise
    cache.data = data
    cache.ts = Date.now()
    return data
  } finally {
    cache.promise = null
  }
}

/**
 * Retourne la catégorie principale à partir des services déjà fetchés et du map categoryById.
 * Sync, aucun fetch, < 5ms. Même output que l'ancienne version (string | null).
 */
export function getMainServiceCategoryFromCatalog(
  services: { serviceId?: string | null }[],
  categoryById: Map<string, string>
): string | null {
  if (services.length === 0) return null
  const categoryCount = new Map<string, number>()
  for (const service of services) {
    if (service.serviceId) {
      const category = categoryById.get(service.serviceId)
      if (category) {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
      }
    }
  }
  if (categoryCount.size === 0) return null
  let maxCategory: string | null = null
  let maxCount = 0
  categoryCount.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count
      maxCategory = category
    }
  })
  return maxCategory
}
