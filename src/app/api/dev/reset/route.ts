import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

const DEV_SEED_TOKEN = process.env.DEV_SEED_TOKEN || 'DEV_SEED_TOKEN'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'autorisation
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

    const deleted = {
      profiles: 0,
      pros: 0,
      services: 0,
      bookings: 0,
      availability: 0,
    }

    // 1. Supprimer les profiles avec slug défini
    const profilesSnapshot = await adminDb.collection('profiles').get()

    const profileDeletes = []
    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data()
      // Ne supprimer que les profiles qui ont un slug
      if (profileData.slug) {
        const profileId = profileDoc.id
        
        // Supprimer les disponibilités associées dans pros/{profileId}/availability
        try {
          const availabilitySnapshot = await adminDb
            .collection('pros')
            .doc(profileId)
            .collection('availability')
            .get()

          const availabilityDeletes = []
          for (const availabilityDoc of availabilitySnapshot.docs) {
            availabilityDeletes.push(availabilityDoc.ref.delete())
            deleted.availability++
          }
          await Promise.all(availabilityDeletes)
        } catch (error) {
          // Pas de disponibilités pour ce pro, ignorer
        }

        profileDeletes.push(profileDoc.ref.delete())
        deleted.profiles++
      }
    }
    await Promise.all(profileDeletes)

    // 2. Supprimer tous les pros (si la collection existe)
    try {
      const prosSnapshot = await adminDb.collection('pros').get()
      const prosDeletes = []
      for (const proDoc of prosSnapshot.docs) {
        // Supprimer les sous-collections availability
        const availabilitySnapshot = await adminDb
          .collection('pros')
          .doc(proDoc.id)
          .collection('availability')
          .get()

        const availabilityDeletes = []
        for (const availabilityDoc of availabilitySnapshot.docs) {
          availabilityDeletes.push(availabilityDoc.ref.delete())
          deleted.availability++
        }
        await Promise.all(availabilityDeletes)

        prosDeletes.push(proDoc.ref.delete())
        deleted.pros++
      }
      await Promise.all(prosDeletes)
    } catch (error) {
      // Collection pros peut ne pas exister, ignorer
    }

    // 3. Supprimer tous les services
    const servicesSnapshot = await adminDb.collection('services').get()
    const serviceDeletes = []
    for (const serviceDoc of servicesSnapshot.docs) {
      serviceDeletes.push(serviceDoc.ref.delete())
      deleted.services++
    }
    await Promise.all(serviceDeletes)

    // 4. Supprimer tous les bookings
    const bookingsSnapshot = await adminDb.collection('bookings').get()
    const bookingDeletes = []
    for (const bookingDoc of bookingsSnapshot.docs) {
      bookingDeletes.push(bookingDoc.ref.delete())
      deleted.bookings++
    }
    await Promise.all(bookingDeletes)

    return NextResponse.json({
      ok: true,
      message: 'Firestore reset complete',
      deleted,
    })
  } catch (error: any) {
    console.error('Error resetting data:', error)
    return NextResponse.json(
      { error: error.message || 'Error resetting data' },
      { status: 500 }
    )
  }
}

