import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Get all services from services_catalog (read-only)
    const catalogSnapshot = await adminDb
      .collection('services_catalog')
      .get()

    const services = catalogSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || '',
        category: data.category || null,
      }
    })

    // Sort by name
    services.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ services })
  } catch (error: any) {
    console.error('[API /services/catalog] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error loading services catalog' },
      { status: 500 }
    )
  }
}

