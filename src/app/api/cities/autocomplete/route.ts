import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

/**
 * Normalize query for matching
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim()
}

/**
 * Calculate relevance score for a city match
 */
function calculateRelevance(city: any, query: string): number {
  const normalizedQuery = normalizeQuery(query)
  const normalizedName = normalizeQuery(city.name)
  
  let score = 0
  
  // Exact match
  if (normalizedName === normalizedQuery) {
    score += 1000
  }
  // Starts with query (highest priority)
  else if (normalizedName.startsWith(normalizedQuery)) {
    score += 500 - normalizedQuery.length
  }
  // Contains query
  else if (normalizedName.includes(normalizedQuery)) {
    score += 200 - normalizedQuery.length
  }
  
  // Boost for larger cities (if population available)
  if (city.population) {
    score += Math.min(city.population / 10000, 100) // Max 100 points for population
  }
  
  return score
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    // If query is too short, return empty array
    if (query.length < 2) {
      return NextResponse.json([])
    }

    const normalizedQuery = normalizeQuery(query)

    // If normalized query is empty after processing, return empty array
    if (normalizedQuery.length < 2) {
      return NextResponse.json([])
    }

    const citiesRef = adminDb.collection('cities_catalog')

    // Fetch cities that match the query (name starts with or contains)
    // Firestore limitations: we can't do case-insensitive or accent-insensitive queries
    // So we fetch a reasonable subset and filter server-side
    const allCitiesSnapshot = await citiesRef
      .limit(500) // Limit initial fetch
      .get()

    // Filter cities server-side
    const cities: any[] = []
    
    for (const doc of allCitiesSnapshot.docs) {
      const data = doc.data()
      const normalizedName = normalizeQuery(data.name)
      
      // Check if city name matches (starts with or contains)
      if (
        normalizedName.startsWith(normalizedQuery) ||
        normalizedName.includes(normalizedQuery)
      ) {
        cities.push({
          id: doc.id,
          name: data.name,
          department: data.department,
          region: data.region,
          location: data.location,
          postalCodes: data.postalCodes || [],
          population: data.population || null,
        })
      }
    }

    // Sort by relevance
    cities.sort((a, b) => {
      const scoreA = calculateRelevance(a, normalizedQuery)
      const scoreB = calculateRelevance(b, normalizedQuery)
      return scoreB - scoreA
    })

    // Limit to top 20 results
    const results = cities.slice(0, 20).map((city) => ({
      id: city.id,
      name: city.name,
      department: city.department,
      region: city.region,
      location: city.location,
    }))

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('[Cities Autocomplete] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching autocomplete suggestions' },
      { status: 500 }
    )
  }
}

