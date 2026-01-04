import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

const DEV_SEED_TOKEN = process.env.DEV_SEED_TOKEN || 'DEV_SEED_TOKEN'

interface GeoCity {
  nom: string
  code: string
  codeDepartement: string
  codeRegion: string
  codesPostaux: string[]
  population: number
  centre: {
    type: string
    coordinates: [number, number] // [lng, lat]
  }
}

interface Region {
  nom: string
  code: string
}

interface CityDocument {
  name: string
  department: string
  region: string
  country: string
  location: {
    lat: number
    lng: number
  }
  postalCodes?: string[]
  population?: number
  created_at?: any
  updated_at?: any
}

/**
 * Generate a unique ID from city name and department code
 */
function generateCityId(name: string, department: string): string {
  // Normalize: lowercase, remove accents, replace spaces with underscores
  const normalizedName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
  
  return `${normalizedName}_${department}`
}

/**
 * Fetch all French regions
 */
async function fetchRegions(): Promise<Map<string, string>> {
  try {
    const response = await fetch('https://geo.api.gouv.fr/regions', {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.status}`)
    }
    
    const regions: Region[] = await response.json()
    const regionMap = new Map<string, string>()
    
    for (const region of regions) {
      regionMap.set(region.code, region.nom)
    }
    
    return regionMap
  } catch (error) {
    console.error('[Cities Catalog] Error fetching regions:', error)
    return new Map()
  }
}

/**
 * Fetch cities for a specific department
 */
async function fetchCitiesByDepartment(
  departmentCode: string,
  regionMap: Map<string, string>
): Promise<CityDocument[]> {
  try {
    // Fetch communes with center coordinates
    const url = `https://geo.api.gouv.fr/departements/${departmentCode}/communes?fields=nom,code,codeDepartement,codeRegion,codesPostaux,population,centre&format=json&geometry=centre`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.warn(`[Cities Catalog] Failed to fetch department ${departmentCode}: ${response.status}`)
      return []
    }
    
    const cities: GeoCity[] = await response.json()
    
    return cities
      .filter((city) => city.centre?.coordinates) // Only cities with coordinates
      .map((city) => {
        const region = regionMap.get(city.codeRegion) || city.codeRegion
        
        // Coordinates from API are [lng, lat], we need [lat, lng]
        const [lng, lat] = city.centre.coordinates
        
        return {
          name: city.nom,
          department: city.codeDepartement,
          region,
          country: 'FR',
          location: {
            lat,
            lng,
          },
          postalCodes: city.codesPostaux || [],
          population: city.population || undefined,
        }
      })
  } catch (error) {
    console.error(`[Cities Catalog] Error fetching department ${departmentCode}:`, error)
    return []
  }
}

/**
 * Get all French department codes
 */
function getDepartmentCodes(): string[] {
  // All French departments (including overseas)
  const departments: string[] = []
  
  // Metropolitan France (01-95)
  for (let i = 1; i <= 95; i++) {
    const code = i.toString().padStart(2, '0')
    // Skip non-existent codes (20 is Corsica, but we use 2A and 2B)
    if (code !== '20') {
      departments.push(code)
    }
  }
  
  // Corsica
  departments.push('2A', '2B')
  
  // Overseas departments
  departments.push('971', '972', '973', '974', '976')
  
  return departments
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    if (token !== DEV_SEED_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('[Cities Catalog] Starting seed...')
    
    // Fetch regions first
    console.log('[Cities Catalog] Fetching regions...')
    const regionMap = await fetchRegions()
    console.log(`[Cities Catalog] Loaded ${regionMap.size} regions`)
    
    // Get all department codes
    const departmentCodes = getDepartmentCodes()
    console.log(`[Cities Catalog] Processing ${departmentCodes.length} departments...`)
    
    let totalInserted = 0
    let totalUpdated = 0
    let totalErrors = 0
    
    // Process departments in batches to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < departmentCodes.length; i += batchSize) {
      const batch = departmentCodes.slice(i, i + batchSize)
      
      console.log(`[Cities Catalog] Processing departments ${i + 1}-${Math.min(i + batchSize, departmentCodes.length)} of ${departmentCodes.length}...`)
      
      // Fetch cities for all departments in batch in parallel
      const cityPromises = batch.map((dept) => fetchCitiesByDepartment(dept, regionMap))
      const cityArrays = await Promise.all(cityPromises)
      
      // Flatten and process cities
      const cities = cityArrays.flat()
      
      // Seed cities to Firestore
      // Using setDoc with merge for idempotency (safe to re-run)
      const seedResults = await Promise.all(
        cities.map(async (city) => {
          try {
            const cityId = generateCityId(city.name, city.department)
            const cityRef = adminDb.collection('cities_catalog').doc(cityId)
            
            // Check if document exists to track inserts vs updates
            const existingDoc = await cityRef.get()
            const isUpdate = existingDoc.exists
            
            // Prepare city document with timestamps
            const cityData: CityDocument = {
              name: city.name,
              department: city.department,
              region: city.region,
              country: city.country,
              location: city.location,
              updated_at: FieldValue.serverTimestamp(),
            }
            
            // Add optional fields
            if (city.postalCodes && city.postalCodes.length > 0) {
              cityData.postalCodes = city.postalCodes
            }
            if (city.population) {
              cityData.population = city.population
            }
            
            // Only set created_at on insert (idempotent)
            if (!isUpdate) {
              cityData.created_at = FieldValue.serverTimestamp()
            }
            
            // Use setDoc with merge for idempotency (safe to re-run)
            await cityRef.set(cityData, { merge: true })
            
            return { action: isUpdate ? 'updated' : 'inserted', error: null }
          } catch (error) {
            console.error(`[Cities Catalog] Error seeding city ${city.name} (${city.department}):`, error)
            return { action: 'error', error }
          }
        })
      )
      
      // Count results
      for (const result of seedResults) {
        if (result.action === 'inserted') {
          totalInserted++
        } else if (result.action === 'updated') {
          totalUpdated++
        } else {
          totalErrors++
        }
      }
      
      // Small delay between batches to respect API rate limits
      if (i + batchSize < departmentCodes.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    
    const totalProcessed = totalInserted + totalUpdated
    
    console.log('[Cities Catalog] Seed completed!')
    console.log(`[Cities Catalog] Total processed: ${totalProcessed}`)
    console.log(`[Cities Catalog] Created: ${totalInserted}`)
    console.log(`[Cities Catalog] Updated: ${totalUpdated}`)
    console.log(`[Cities Catalog] Errors: ${totalErrors}`)
    
    return NextResponse.json({
      ok: true,
      total: totalProcessed,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: totalErrors,
      message: `Successfully processed ${totalProcessed} cities (${totalInserted} created, ${totalUpdated} updated, ${totalErrors} errors)`,
    })
  } catch (error: any) {
    console.error('[Cities Catalog] Error seeding cities:', error)
    return NextResponse.json(
      { error: error.message || 'Error seeding cities catalog' },
      { status: 500 }
    )
  }
}

