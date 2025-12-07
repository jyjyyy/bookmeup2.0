import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ServicePageProps {
  params: Promise<{ service_id: string }>
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { service_id } = await params

  try {
    // Charger le service
    const serviceDoc = await getDoc(doc(db, 'services', service_id))
    
    if (!serviceDoc.exists()) {
      notFound()
    }

    const serviceData = serviceDoc.data()
    
    // Vérifier que le service est actif
    if (serviceData.isActive === false) {
      notFound()
    }

    const service = {
      id: serviceDoc.id,
      ...serviceData,
      created_at: serviceData.created_at?.toDate?.()?.toISOString() || null,
      updated_at: serviceData.updated_at?.toDate?.()?.toISOString() || null,
    }

    // Charger le pro (essayer pros d'abord pour avoir business_name et slug)
    let pro = null
    const prosDoc = await getDoc(doc(db, 'pros', serviceData.proId))
    
    if (prosDoc.exists()) {
      const prosData = prosDoc.data()
      // Get profile for name fallback
      const proProfileDoc = await getDoc(doc(db, 'profiles', serviceData.proId))
      let name = prosData.business_name || 'Professionnel'
      
      if (proProfileDoc.exists()) {
        const profileData = proProfileDoc.data()
        name = profileData.name || name
      }

      pro = {
        id: prosDoc.id,
        name,
        slug: prosData.slug || prosDoc.id,
        city: prosData.city || null,
      }
    } else {
      // Fallback to profiles
      const proDoc = await getDoc(doc(db, 'profiles', serviceData.proId))
      if (proDoc.exists()) {
        const proData = proDoc.data()
        pro = {
          id: proDoc.id,
          name: proData.name || proData.email || 'Professionnel',
          slug: proData.slug || proDoc.id,
          city: proData.city || null,
        }
      }
    }

    const proSlug = pro?.slug || pro?.id || serviceData.proId

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8">
              <h1 className="text-4xl font-bold text-primary mb-4">
                {service.name}
              </h1>
              
              {pro && (
                <p className="text-xl text-gray-600 mb-6">
                  avec {pro.name}
                </p>
              )}

              <div className="mb-6">
                <p className="text-gray-700 whitespace-pre-line">
                  {service.description}
                </p>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div>
                  <span className="text-sm text-gray-500">Durée</span>
                  <p className="text-lg font-semibold">{service.duration} minutes</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Prix</span>
                  <p className="text-lg font-semibold text-primary">
                    {service.price} €
                  </p>
                </div>
              </div>

              <Link href={`/booking/${proSlug}?service_id=${service.id}`}>
                <Button size="lg" className="w-full">
                  Réserver ce service
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading service:', error)
    notFound()
  }
}
