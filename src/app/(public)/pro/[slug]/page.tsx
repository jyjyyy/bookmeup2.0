import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'

interface ProPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProPage({ params }: ProPageProps) {
  const { slug } = await params

  try {
    // Chercher le pro par slug dans pros
    const prosQuery = query(
      collection(db, 'pros'),
      where('slug', '==', slug)
    )
    const prosSnapshot = await getDocs(prosQuery)

    let pro = null
    let proId = null

    if (!prosSnapshot.empty) {
      const proDoc = prosSnapshot.docs[0]
      const proData = proDoc.data()
      proId = proDoc.id

      // Get profile for name
      const profileDoc = await getDoc(doc(db, 'profiles', proId))
      let name = proData.business_name || 'Professionnel'
      let description = proData.description || null

      if (profileDoc.exists()) {
        const profileData = profileDoc.data()
        name = profileData.name || name
        description = profileData.description || description
      }

      pro = {
        id: proId,
        name,
        slug: proData.slug || slug,
        city: proData.city || null,
        description,
        plan: proData.plan || 'starter',
      }
    } else {
      // Try profiles
      const profilesQuery = query(
        collection(db, 'profiles'),
        where('slug', '==', slug)
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
          slug: profileData.slug || slug,
          city: profileData.city || prosData.city || null,
          description: profileData.description || prosData.description || null,
          plan: prosData.plan || 'starter',
        }
      }
    }

    if (!pro || !proId) {
      notFound()
    }

    // Load services
    const servicesQuery = query(
      collection(db, 'services'),
      where('proId', '==', proId),
      where('isActive', '==', true)
    )
    const servicesSnapshot = await getDocs(servicesQuery)

    const services = servicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Pro Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="rounded-[32px] p-8">
                <h1 className="text-4xl font-bold text-primary mb-2">
                  {pro.name}
                </h1>
                {pro.city && (
                  <p className="text-gray-600 text-lg mb-4">📍 {pro.city}</p>
                )}
                {pro.description && (
                  <p className="text-gray-700 whitespace-pre-line">
                    {pro.description}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Services */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Services disponibles
              </h2>

              {services.length === 0 ? (
                <Card className="rounded-[32px] p-8 text-center">
                  <p className="text-gray-600">
                    Aucun service disponible pour le moment.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {services.map((service: any, index: number) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="rounded-[32px] p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-2xl font-bold text-primary">
                              {service.price} €
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.duration} min
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/service/${service.id}`}
                            className="flex-1"
                          >
                            <Button variant="outline" className="w-full rounded-[32px]">
                              Détails
                            </Button>
                          </Link>
                          <Link
                            href={`/booking/${pro.slug}?service_id=${service.id}`}
                            className="flex-1"
                          >
                            <Button className="w-full rounded-[32px]">
                              Réserver
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            {services.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="rounded-[32px] p-6 bg-pink-50 border-2 border-primary">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Prêt à réserver ?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Choisissez un service et réservez votre créneau
                    </p>
                    <Link href={`/booking/${pro.slug}`}>
                      <Button size="lg" className="rounded-[32px]">
                        Réserver un rendez-vous
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading pro page:', error)
    notFound()
  }
}

