import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

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

    const slug = 'mila-beauty-paris'

    // Vérifier si le pro existe déjà
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    let proId: string
    let serviceId: string

    if (!profilesSnapshot.empty) {
      // Pro existe déjà, récupérer ses IDs
      const existingPro = profilesSnapshot.docs[0]
      proId = existingPro.id

      // Chercher un service existant pour ce pro
      const servicesSnapshot = await adminDb
        .collection('services')
        .where('proId', '==', proId)
        .limit(1)
        .get()

      if (!servicesSnapshot.empty) {
        serviceId = servicesSnapshot.docs[0].id
      } else {
        // Créer le service s'il n'existe pas
        const serviceRef = await adminDb.collection('services').add({
          proId,
          name: 'Pose d\'ongles',
          description: 'Pose complète de gel avec finition brillante',
          duration: 60,
          price: 45,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        })
        serviceId = serviceRef.id
      }
    } else {
      // Créer le pro
      const proRef = await adminDb.collection('profiles').add({
        slug,
        name: 'Mila Beauty',
        email: 'pro@example.com',
        city: 'Paris',
        show_in_search: true,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      })
      proId = proRef.id

      // Créer le service
      const serviceRef = await adminDb.collection('services').add({
        proId,
        name: 'Pose d\'ongles',
        description: 'Pose complète de gel avec finition brillante',
        duration: 60,
        price: 45,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      })
      serviceId = serviceRef.id

      // Créer les disponibilités pour lundi à samedi (1-6)
      const availabilityPromises = []
      for (let day = 1; day <= 6; day++) {
        const availabilityRef = adminDb
          .collection('pros')
          .doc(proId)
          .collection('availability')
          .doc(day.toString())

        availabilityPromises.push(
          availabilityRef.set({
            isEnabled: true,
            startTime: '09:00',
            endTime: '18:00',
            created_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          })
        )
      }
      await Promise.all(availabilityPromises)
    }

    return NextResponse.json({
      ok: true,
      proId,
      serviceId,
      slug,
    })
  } catch (error: any) {
    console.error('Error seeding data:', error)
    return NextResponse.json(
      { error: error.message || 'Error seeding data' },
      { status: 500 }
    )
  }
}

