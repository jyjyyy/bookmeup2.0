import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { ProGallery } from './ProGallery'
import { ProSocials } from './ProSocials'
import { ProServicesList } from './ProServicesList'

interface ProPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProPage({ params }: ProPageProps) {
  const { slug } = await params

  // Detect viewer role to conditionally render subscription info
  let isClientViewer = true // Default to CLIENT view (public page)
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')?.value
    if (sessionCookie) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie)
        const viewerProfileDoc = await adminDb.collection('profiles').doc(decodedClaims.uid).get()
        if (viewerProfileDoc.exists) {
          const viewerProfileData = viewerProfileDoc.data()
          // Only PRO users viewing their own profile see subscription info
          isClientViewer = viewerProfileData?.role !== 'pro'
        }
      } catch (error) {
        // Invalid session, treat as CLIENT view
        isClientViewer = true
      }
    }
  } catch (error) {
    // Error reading cookies, treat as CLIENT view
    isClientViewer = true
  }

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
        // Remove plan field from CLIENT view - subscription info is PRO-only
        ...(isClientViewer ? {} : { plan: proData.plan || 'starter' }),
        socials: proData.socials || null,
        gallery: proData.gallery || null,
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
          // Remove plan field from CLIENT view - subscription info is PRO-only
          ...(isClientViewer ? {} : { plan: prosData.plan || 'starter' }),
          socials: prosData.socials || null,
          gallery: prosData.gallery || null,
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

    const services = servicesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
      }
    })

    // Get first letter of name for avatar
    const avatarLetter = pro.name?.[0]?.toUpperCase() || 'P'

    return (
      <div className="min-h-screen bg-background py-10 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* 1. HERO Premium */}
          <div className="mb-12">
            <Card className="rounded-[32px] p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Colonne gauche - Avatar + Nom + Ville */}
                <div className="flex items-start gap-4 md:gap-6">
                  {/* Avatar circulaire */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary flex items-center justify-center text-3xl md:text-4xl font-bold text-primary flex-shrink-0">
                    {avatarLetter}
                  </div>
                  
                  <div className="flex-1">
                    {/* Nom du professionnel */}
                    <h1 className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-2">
                      {pro.name}
                    </h1>

                    {/* Ville */}
                    {pro.city && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                        <span>📍</span>
                        <span>{pro.city}</span>
                      </p>
                    )}

                    {/* Réseaux sociaux */}
                    <ProSocials socials={pro.socials} />

                    {/* Description courte */}
                    {pro.description && (
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm md:text-base line-clamp-3">
                        {pro.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton principal CTA */}
              <div className="mt-8">
                <Link href={`/booking/${pro.slug}`}>
                  <Button size="lg" className="w-full md:w-auto rounded-[32px]">
                    Réserver un rendez-vous
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* 2. Bloc Infos Clés */}
          <div className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Carte Ville */}
              {pro.city && (
                <Card className="rounded-[32px] p-6 text-center">
                  <div className="text-2xl mb-2">📍</div>
                  <p className="text-xs text-slate-500 mb-1">Ville</p>
                  <p className="text-sm font-semibold text-[#2A1F2D]">{pro.city}</p>
                </Card>
              )}

              {/* Carte Nombre de services */}
              <Card className="rounded-[32px] p-6 text-center">
                <div className="text-2xl mb-2">✨</div>
                <p className="text-xs text-slate-500 mb-1">Services</p>
                <p className="text-sm font-semibold text-[#2A1F2D]">
                  {services.length} disponible{services.length > 1 ? 's' : ''}
                </p>
              </Card>

              {/* Carte Galerie */}
              {pro.gallery?.images && pro.gallery.images.length > 0 && (
                <Card className="rounded-[32px] p-6 text-center">
                  <div className="text-2xl mb-2">📸</div>
                  <p className="text-xs text-slate-500 mb-1">Galerie</p>
                  <p className="text-sm font-semibold text-[#2A1F2D]">
                    {pro.gallery.images.length} photo{pro.gallery.images.length > 1 ? 's' : ''}
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* 3. Galerie */}
          {pro.gallery?.images && pro.gallery.images.length > 0 && (
            <ProGallery images={pro.gallery.images} />
          )}

          {/* 4. Liste des Services */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#2A1F2D] mb-2">
                Services proposés
              </h2>
              <p className="text-sm text-slate-500">
                Choisissez une prestation pour voir les détails et réserver.
              </p>
            </div>

            <ProServicesList services={services} proSlug={pro.slug} />
          </div>

          {/* 5. CTA Final */}
          {services.length > 0 && (
            <Card className="rounded-[32px] mt-8 bg-gradient-to-r from-primary to-[#9C44AF] text-white border-none p-8 md:p-10">
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  Prête à réserver ton moment beauté ?
                </h3>
                <p className="text-white/90 mb-6 text-sm md:text-base">
                  Choisis un service et réserve directement en ligne en quelques secondes.
                </p>
                <Link href={`/booking/${pro.slug}`}>
                  <Button
                    variant="subtle"
                    size="lg"
                    className="rounded-[32px] bg-white text-primary border-2 border-primary shadow-md hover:bg-primary hover:text-white hover:shadow-lg"
                  >
                    Réserver maintenant
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading pro page:', error)
    notFound()
  }
}

