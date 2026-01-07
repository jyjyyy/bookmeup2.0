import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { BookingPageClient } from './BookingPageClient'
import { notFound } from 'next/navigation'
import { serializeTimestamps } from '@/lib/firestore'
import type { BookingPro, BookingService } from './types'

interface BookingPageProps {
  params: Promise<{ pro_slug: string }>
  searchParams: Promise<{ service_id?: string; date?: string; time?: string }>
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { pro_slug } = await params
  const { service_id, date, time } = await searchParams

  try {
    // Chercher le pro par slug dans pros (priorité)
    const prosQuery = query(
      collection(db, 'pros'),
      where('slug', '==', pro_slug)
    )
    const prosSnapshot = await getDocs(prosQuery)

    let pro: BookingPro | null = null
    let proId: string | null = null

    if (!prosSnapshot.empty) {
      const proDoc = prosSnapshot.docs[0]
      const proData = proDoc.data()
      proId = proDoc.id

      // Get profile for name fallback
      const proProfileDoc = await getDoc(doc(db, 'profiles', proId))
      let name = proData.business_name || 'Professionnel'
      let description = proData.description || null

      if (proProfileDoc.exists()) {
        const profileData = proProfileDoc.data()
        name = profileData.name || name
        description = profileData.description || description
      }

      pro = {
        id: proId,
        name,
        slug: proData.slug || pro_slug,
        city: proData.city || null,
        description,
      }
    } else {
      // Fallback: chercher dans profiles
      const profilesQuery = query(
        collection(db, 'profiles'),
        where('slug', '==', pro_slug)
      )
      const profilesSnapshot = await getDocs(profilesQuery)

      if (!profilesSnapshot.empty) {
        const profileDoc = profilesSnapshot.docs[0]
        const profileData = profileDoc.data()
        proId = profileDoc.id

        // Check if has pros document
        const prosDoc = await getDoc(doc(db, 'pros', proId))
        const prosData = prosDoc.exists() ? prosDoc.data() : {}

        pro = {
          id: proId,
          name: profileData.name || profileData.email || 'Professionnel',
          slug: profileData.slug || pro_slug,
          city: profileData.city || prosData.city || null,
          description: profileData.description || prosData.description || null,
        }
      }
    }

    if (!pro || !proId) {
      notFound()
    }

    // Charger les services actifs du pro
    const servicesQuery = query(
      collection(db, 'services'),
      where('proId', '==', proId),
      where('isActive', '==', true)
    )
    const servicesSnapshot = await getDocs(servicesQuery)

    // Sérialiser les services avec timestamps
    const services = servicesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return serializeTimestamps({
        id: doc.id,
        name: data.name,
        description: data.description || null,
        duration: data.duration,
        price: data.price,
        isActive: data.isActive,
        created_at: data.created_at,
        updated_at: data.updated_at,
      })
    }) as BookingService[]

    if (services.length === 0) {
      return (
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-primary mb-4">
                Aucun service disponible
              </h1>
              <p className="text-slate-600">
                Ce professionnel n'a pas encore de services disponibles.
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Sérialiser le pro
    const serializedPro = serializeTimestamps(pro) as BookingPro

    return (
      <div className="min-h-screen bg-background py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <BookingPageClient
            pro={serializedPro}
            services={services}
            initialServiceId={service_id ?? null}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading booking page:', error)
    notFound()
  }
}
