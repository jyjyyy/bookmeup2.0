import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { ConfirmCard } from './ConfirmCard'
import { notFound } from 'next/navigation'

interface ConfirmPageProps {
  searchParams: Promise<{ bookingId?: string }>
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams
  const bookingId = params.bookingId

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">
              Réservation non trouvée
            </h1>
            <p className="text-gray-600">
              L'identifiant de réservation est manquant.
            </p>
          </div>
        </div>
      </div>
    )
  }

  try {
    // Charger la réservation
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId))

    if (!bookingDoc.exists()) {
      notFound()
    }

    const bookingData = bookingDoc.data()
    const booking = {
      id: bookingDoc.id,
      client_name: bookingData.client_name,
      date: bookingData.date,
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
    }

    // Charger le service
    const serviceDoc = await getDoc(doc(db, 'services', bookingData.service_id))
    if (!serviceDoc.exists()) {
      notFound()
    }

    const serviceData = serviceDoc.data()
    const service = {
      name: serviceData.name,
      duration: serviceData.duration,
      price: serviceData.price,
    }

    // Charger le pro
    let pro = null

    // Essayer pros d'abord (contient business_name)
    const proDoc = await getDoc(doc(db, 'pros', bookingData.pro_id))
    if (proDoc.exists()) {
      const proData = proDoc.data()
      // Get profile for name fallback
      const proProfileDoc = await getDoc(doc(db, 'profiles', bookingData.pro_id))
      let name = proData.business_name || 'Professionnel'
      
      if (proProfileDoc.exists()) {
        const profileData = proProfileDoc.data()
        name = profileData.name || name
      }

      pro = {
        name,
        city: proData.city || null,
      }
    } else {
      // Fallback to profiles
      const proProfileDoc = await getDoc(doc(db, 'profiles', bookingData.pro_id))
      if (proProfileDoc.exists()) {
        const proData = proProfileDoc.data()
        pro = {
          name: proData.name || proData.email || 'Professionnel',
          city: proData.city || null,
        }
      }
    }

    if (!pro) {
      pro = {
        name: 'Professionnel',
        city: null,
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <ConfirmCard booking={booking} service={service} pro={pro} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading confirmation:', error)
    notFound()
  }
}
