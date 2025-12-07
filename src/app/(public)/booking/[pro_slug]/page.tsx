import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { BookingPageClient } from './BookingPageClient'
import { notFound } from 'next/navigation'

interface BookingPageProps {
  params: Promise<{ pro_slug: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { pro_slug } = await params

  try {
    // Chercher le pro par slug dans profiles
    const profilesQuery = query(
      collection(db, 'profiles'),
      where('slug', '==', pro_slug)
    )
    const profilesSnapshot = await getDocs(profilesQuery)

    let pro = null
    let proId = null

    // Chercher d'abord dans pros (contient slug et business_name)
    const prosQuery = query(
      collection(db, 'pros'),
      where('slug', '==', pro_slug)
    )
    const prosSnapshot = await getDocs(prosQuery)

    if (!prosSnapshot.empty) {
      const proDoc = prosSnapshot.docs[0]
      const proData = proDoc.data()
      proId = proDoc.id

      // Get profile for name fallback
      const proProfileDoc = await getDoc(doc(db, 'profiles', proId))
      let name = proData.business_name || 'Professionnel'
      
      if (proProfileDoc.exists()) {
        const profileData = proProfileDoc.data()
        name = profileData.name || name
      }

      pro = {
        id: proId,
        name,
        slug: proData.slug || pro_slug,
        city: proData.city || null,
      }
    } else {
      // Chercher dans profiles
      if (!profilesSnapshot.empty) {
        const proDoc = profilesSnapshot.docs[0]
        const proData = proDoc.data()
        proId = proDoc.id

        // Check if has pros document
        const prosDoc = await getDoc(doc(db, 'pros', proId))
        const prosData = prosDoc.exists() ? prosDoc.data() : {}

        pro = {
          id: proId,
          name: proData.name || proData.email || 'Professionnel',
          slug: proData.slug || pro_slug,
          city: proData.city || prosData.city || null,
        }
      } else {
        // Essayer avec l'ID directement
        const proDoc = await getDoc(doc(db, 'profiles', pro_slug))
        if (proDoc.exists()) {
          const proData = proDoc.data()
          proId = proDoc.id

          // Check if has pros document
          const prosDoc = await getDoc(doc(db, 'pros', proId))
          const prosData = prosDoc.exists() ? prosDoc.data() : {}

          pro = {
            id: proId,
            name: proData.name || proData.email || 'Professionnel',
            slug: proData.slug || pro_slug,
            city: proData.city || prosData.city || null,
          }
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

    const services = servicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[]

    if (services.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-primary mb-4">
                Aucun service disponible
              </h1>
              <p className="text-gray-600">
                Ce professionnel n'a pas encore de services disponibles.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <BookingPageClient pro={pro} services={services} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading booking page:', error)
    notFound()
  }
}
