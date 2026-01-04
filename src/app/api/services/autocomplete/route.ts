import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

/**
 * Normalize query string for search
 * - Convert to lowercase
 * - Remove accents
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim()
}

/**
 * Calculate relevance score for a service match
 * Higher score = better match
 */
function calculateRelevance(
  service: any,
  normalizedQuery: string
): number {
  let score = 0
  const nameLower = normalizeQuery(service.name)
  const aliasesLower = (service.aliases || []).map((a: string) => normalizeQuery(a))
  const keywordsLower = (service.keywords || []).map((k: string) => normalizeQuery(k))

  // Exact name match = highest score
  if (nameLower === normalizedQuery) {
    score += 100
  }
  // Name starts with query = high score
  else if (nameLower.startsWith(normalizedQuery)) {
    score += 50
  }
  // Name contains query = medium score
  else if (nameLower.includes(normalizedQuery)) {
    score += 30
  }

  // Alias exact match = high score
  if (aliasesLower.includes(normalizedQuery)) {
    score += 40
  }
  // Alias contains query = medium score
  else {
    for (const alias of aliasesLower) {
      if (alias.includes(normalizedQuery)) {
        score += 20
        break
      }
    }
  }

  // Keyword exact match = medium score
  if (keywordsLower.includes(normalizedQuery)) {
    score += 30
  }
  // Keyword contains query = low score
  else {
    for (const keyword of keywordsLower) {
      if (keyword.includes(normalizedQuery)) {
        score += 10
        break
      }
    }
  }

  return score
}

/**
 * GET /api/services/autocomplete
 * Returns autocomplete suggestions for beauty services
 * 
 * Query parameters:
 * - q: search query string (required)
 * 
 * Response:
 * [
 *   {
 *     id: string,
 *     name: string,
 *     category: string
 *   }
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || null

    // If query is too short, return empty array
    if (query.length < 1) {
      return NextResponse.json([])
    }

    // If category is provided, validate it
    const validCategories = [
      'ongles',
      'coiffure_femme',
      'coiffure_homme',
      'coiffure_enfant',
      'regard',
      'soins_visage',
      'soins_corps',
      'massages',
      'épilation',
      'maquillage',
      'services_spécifiques',
    ]
    
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    const normalizedQuery = normalizeQuery(query)

    // If normalized query is empty after processing, return empty array
    if (normalizedQuery.length < 1) {
      return NextResponse.json([])
    }

    const catalogRef = adminDb.collection('services_catalog')

    // Strategy: Fetch potential matches and filter/rank server-side
    // Firestore limitations:
    // - array-contains only works for exact matches
    // - We need "contains" and "starts with" matching with normalization
    // - Combining array-contains with category filter requires composite index
    // - So we'll fetch a reasonable subset and filter server-side

    // 1. Try exact match on aliases and keywords first (fastest)
    const aliasesQuery = catalogRef
      .where('aliases', 'array-contains', normalizedQuery)
      .limit(50)

    const keywordsQuery = catalogRef
      .where('keywords', 'array-contains', normalizedQuery)
      .limit(50)

    // 2. Fetch a reasonable subset for name-based filtering
    // If category is provided, filter by category in Firestore (simple query, no composite index needed)
    let allServicesQuery = catalogRef.limit(200)
    if (category) {
      allServicesQuery = allServicesQuery.where('category', '==', category)
    }

    // Execute queries in parallel
    const [aliasesSnapshot, keywordsSnapshot, allServicesSnapshot] = await Promise.all([
      aliasesQuery.get(),
      keywordsQuery.get(),
      allServicesQuery.get(),
    ])

    // Combine results and deduplicate by document ID
    const serviceMap = new Map<string, any>()

    // Add results from aliases exact match
    aliasesSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      // Filter by category if provided
      if (category && data.category !== category) {
        return
      }
      serviceMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        category: data.category,
        aliases: data.aliases || [],
        keywords: data.keywords || [],
      })
    })

    // Add results from keywords exact match
    keywordsSnapshot.docs.forEach((doc) => {
      if (!serviceMap.has(doc.id)) {
        const data = doc.data()
        // Filter by category if provided
        if (category && data.category !== category) {
          return
        }
        serviceMap.set(doc.id, {
          id: doc.id,
          name: data.name,
          category: data.category,
          aliases: data.aliases || [],
          keywords: data.keywords || [],
        })
      }
    })

    // Filter all services for name/alias/keyword matches (normalized)
    allServicesSnapshot.docs.forEach((doc) => {
      if (!serviceMap.has(doc.id)) {
        const data = doc.data()
        const nameLower = normalizeQuery(data.name)
        const aliasesLower = (data.aliases || []).map((a: string) => normalizeQuery(a))
        const keywordsLower = (data.keywords || []).map((k: string) => normalizeQuery(k))

        // Filter by category if provided
        if (category && data.category !== category) {
          return
        }

        // Check if service matches (name starts with, contains, or alias/keyword contains)
        const matchesNameStart = nameLower.startsWith(normalizedQuery)
        const matchesNameContains = nameLower.includes(normalizedQuery)
        const matchesAlias = aliasesLower.some((a: string) => a.includes(normalizedQuery))
        const matchesKeyword = keywordsLower.some((k: string) => k.includes(normalizedQuery))

        if (matchesNameStart || matchesNameContains || matchesAlias || matchesKeyword) {
          serviceMap.set(doc.id, {
            id: doc.id,
            name: data.name,
            category: data.category,
            aliases: data.aliases || [],
            keywords: data.keywords || [],
          })
        }
      }
    })

    // Convert map to array and calculate relevance scores
    let services = Array.from(serviceMap.values())
      .map((service) => ({
        ...service,
        relevance: calculateRelevance(service, normalizedQuery),
      }))

    // Filter by category if provided
    if (category) {
      services = services.filter((service) => service.category === category)
    }

    // Sort by relevance (highest first)
    services = services
      .sort((a, b) => b.relevance - a.relevance)
      // Limit to top 15 results
      .slice(0, 15)
      // Remove relevance score from response
      .map(({ relevance, ...service }) => ({
        id: service.id,
        name: service.name,
        category: service.category,
      }))

    return NextResponse.json(services)
  } catch (error: any) {
    console.error('[Services Autocomplete] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching autocomplete suggestions' },
      { status: 500 }
    )
  }
}

