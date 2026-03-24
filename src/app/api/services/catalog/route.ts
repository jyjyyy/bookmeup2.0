import { NextRequest, NextResponse } from 'next/server'
import { getCatalogCached } from '@/lib/catalogCache'

export async function GET(request: NextRequest) {
  try {
    const { services } = await getCatalogCached()

    return NextResponse.json(
      { services },
      {
        headers: {
          'Cache-Control':
            'public, max-age=60, s-maxage=600, stale-while-revalidate=600',
        },
      }
    )
  } catch (error: any) {
    console.error('[API /services/catalog] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error loading services catalog' },
      { status: 500 }
    )
  }
}
