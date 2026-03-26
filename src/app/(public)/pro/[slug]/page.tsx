import { unstable_cache } from 'next/cache'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { ProGallery } from './ProGallery'
import { ProSocials } from './ProSocials'
import { ProServicesList } from './ProServicesList'
import { PHOTOS_ENABLED } from '@/lib/features'
import {
  getCatalogCached,
  getMainServiceCategoryFromCatalog,
} from '@/lib/catalogCache'
import type { Metadata } from 'next'

interface ProPageProps {
  params: Promise<{ slug: string }>
}

type PublicPro = {
  id: string
  name: string
  slug: string
  city: string | null
  description: string | null
  plan?: string
  socials: any
  gallery: any
}

type ProLookupResult = {
  pro: PublicPro | null
  proId: string | null
}

const PRO_TTL_SECONDS = 300
const SERVICES_TTL_SECONDS = 300

const getProBySlugCached = unstable_cache(
  async (slug: string, isClientViewer: boolean): Promise<ProLookupResult> => {
    // Try pros by slug
    const prosSnapshot = await adminDb
      .collection('pros')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (!prosSnapshot.empty) {
      const proDoc = prosSnapshot.docs[0]
      const proData = proDoc.data()
      const proId = proDoc.id

      const profileDoc = await adminDb.collection('profiles').doc(proId).get()
      let name = proData.business_name || 'Professionnel'
      let description = proData.description || null
      if (profileDoc.exists) {
        const profileData = profileDoc.data()
        name = profileData?.name || name
        description = profileData?.description || description
      }

      return {
        proId,
        pro: {
          id: proId,
          name,
          slug: proData.slug || slug,
          city: proData.city || null,
          description,
          ...(isClientViewer ? {} : { plan: proData.plan || 'starter' }),
          socials: proData.socials || null,
          gallery: proData.gallery || null,
        },
      }
    }

    // Fallback: try profiles by slug
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (profilesSnapshot.empty) {
      return { pro: null, proId: null }
    }

    const profileDoc = profilesSnapshot.docs[0]
    const profileData = profileDoc.data()
    const proId = profileDoc.id

    const prosDoc = await adminDb.collection('pros').doc(proId).get()
    const prosData = prosDoc.exists ? prosDoc.data() : {}

    return {
      proId,
      pro: {
        id: proId,
        name: profileData?.name || profileData?.email || 'Professionnel',
        slug: profileData?.slug || slug,
        city: profileData?.city || prosData?.city || null,
        description: profileData?.description || prosData?.description || null,
        ...(isClientViewer ? {} : { plan: prosData?.plan || 'starter' }),
        socials: prosData?.socials || null,
        gallery: prosData?.gallery || null,
      },
    }
  },
  ['proBySlug-v1'],
  { revalidate: PRO_TTL_SECONDS }
)

type ProService = {
  id: string
  serviceId?: string | null
  [key: string]: any
}

const getServicesByProIdCached = unstable_cache(
  async (proId: string): Promise<ProService[]> => {
    const snapshot = await adminDb
      .collection('services')
      .where('proId', '==', proId)
      .where('isActive', '==', true)
      .get()

    return snapshot.docs.map((d) => {
      const data = d.data() as any
      return {
        id: d.id,
        ...data,
        created_at: data?.created_at?.toDate?.()?.toISOString?.() || null,
        updated_at: data?.updated_at?.toDate?.()?.toISOString?.() || null,
      }
    })
  },
  ['servicesByProId-v1'],
  { revalidate: SERVICES_TTL_SECONDS }
)

// Generate SEO metadata
export async function generateMetadata({ params }: ProPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    // Public metadata is client-view: never expose plan in SEO.
    const [{ pro, proId }, catalog] = await Promise.all([
      getProBySlugCached(slug, true),
      getCatalogCached(),
    ])

    let businessName = pro?.name || 'Professionnel'
    let city: string | null = pro?.city || null

    let mainService: string | null = null
    if (proId) {
      const services = await getServicesByProIdCached(proId)
      mainService = getMainServiceCategoryFromCatalog(
        services as { serviceId?: string | null }[],
        catalog.categoryById
      )
    }

    // Generate title
    let title = businessName
    if (mainService && city) {
      title = `${mainService} à ${city} – ${businessName}`
    } else if (city) {
      title = `${businessName} à ${city}`
    } else {
      title = `${businessName} – Réservation en ligne`
    }

    // Generate description with service list if available
    let description = `Découvrez les services de ${businessName}`
    if (city) {
      description += ` à ${city}`
    }
    
    // Add service list if services exist and space allows (reuse cached services; keep logic identical)
    if (proId) {
      try {
        const services = await getServicesByProIdCached(proId)
        const serviceNames = services
          .slice(0, 3)
          .map((s: any) => s?.name)
          .filter(Boolean) as string[]

        if (serviceNames.length > 0) {
          const servicesText = serviceNames.join(', ')
          const withServices = `${description}. ${servicesText}. Réservation en ligne.`
          if (withServices.length <= 155) {
            description = withServices
          } else {
            description += '. Réservation en ligne simple et rapide.'
          }
        } else {
          description += '. Réservation en ligne simple et rapide.'
        }
      } catch {
        description += '. Réservation en ligne simple et rapide.'
      }
    } else {
      description += '. Réservation en ligne simple et rapide.'
    }

    // Truncate to ~155 characters
    if (description.length > 155) {
      description = description.substring(0, 152) + '...'
    }

    // Canonical URL
    const canonicalUrl = `https://www.bookmeup.fr/pro/${slug}`

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Professionnel – BookMeUp',
      description: 'Découvrez ce professionnel sur BookMeUp. Réservation en ligne simple et rapide.',
    }
  }
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
    const t0Page = performance.now()

    // Démarrer le catalog le plus tôt possible (indépendant du proId)
    const catalogPromise = getCatalogCached()

    // Pro lookup (cached, read-only)
    const t0FetchPro = performance.now()
    const { pro, proId } = await getProBySlugCached(slug, isClientViewer)
    console.log(
      `[PERF] fetch pro (cached): ${(performance.now() - t0FetchPro).toFixed(1)}ms`,
      { slug }
    )

    if (!pro || !proId) notFound()

    // Services + catalog en parallèle, puis mainCategory sans refetch
    const t0FetchServices = performance.now()
    const [services, catalog] = await Promise.all([
      getServicesByProIdCached(proId),
      catalogPromise,
    ])
    console.log(
      `[PERF] fetch services (cached): ${(performance.now() - t0FetchServices).toFixed(1)}ms`,
      { proId }
    )

    const t0MainServiceCategory = performance.now()
    const mainServiceCategory = getMainServiceCategoryFromCatalog(
      services as { serviceId?: string | null }[],
      catalog.categoryById
    )
    console.log(
      `[PERF] getMainServiceCategory (no refetch): ${(performance.now() - t0MainServiceCategory).toFixed(1)}ms`,
      { proId }
    )

    // Get first letter of name for avatar
    const avatarLetter = pro.name?.[0]?.toUpperCase() || 'P'

    return (
      <div className="min-h-screen bg-background">
        {/* Hero banner */}
        <div className="hero-dark h-48 md:h-56 relative">
          <div className="max-w-5xl mx-auto px-4 h-full flex items-end pb-0 relative z-10" />
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-16">
          {/* 1. Profile card (overlapping hero) */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-bookmeup border border-[#EDE8F0] -mt-10 mb-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-3xl md:text-4xl font-extrabold text-white flex-shrink-0 border-4 border-white shadow-md">
                {avatarLetter}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#2A1F2D] leading-tight">
                    {pro.city ? `${pro.name} – ${pro.city}` : pro.name}
                  </h1>
                </div>

                {pro.city && (
                  <p className="text-sm text-[#7A6B80] flex items-center gap-1.5 mb-3">
                    <span>📍</span><span>{pro.city}</span>
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="chip">✓ Profil vérifié</span>
                  <span className="chip">{services.length} prestation{services.length > 1 ? 's' : ''}</span>
                  {PHOTOS_ENABLED && pro.gallery?.images && pro.gallery.images.length > 0 && (
                    <span className="chip">📸 {pro.gallery.images.length} photo{pro.gallery.images.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                <ProSocials socials={pro.socials} />

                {pro.description && (
                  <p className="text-[#7A6B80] leading-relaxed text-sm line-clamp-3 mt-2">
                    {pro.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Galerie */}
          {PHOTOS_ENABLED && pro.gallery?.images && pro.gallery.images.length > 0 && (
            <div className="mb-8">
              <ProGallery images={pro.gallery.images} />
            </div>
          )}

          {/* 3. Portfolio social (si pas de galerie) */}
          {pro.socials && (pro.socials.instagram_url || pro.socials.facebook_url) && (
            <div className="mb-8">
              <div className="bg-white rounded-[24px] p-6 border border-[#EDE8F0] shadow-bookmeup-sm">
                <h2 className="text-lg font-bold text-[#2A1F2D] mb-1">Portfolio</h2>
                <p className="text-sm text-[#7A6B80] mb-4">Retrouvez mes réalisations sur mes réseaux.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {pro.socials.instagram_url && (
                    <a
                      href={pro.socials.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[16px] bg-gradient-to-r from-[#E4405F] to-[#C13584] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span>📷</span> Voir Instagram
                    </a>
                  )}
                  {pro.socials.facebook_url && (
                    <a
                      href={pro.socials.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[16px] bg-[#1877F2] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span>👥</span> Voir Facebook
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Services list */}
          <div>
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Prestations</h2>
              <p className="text-sm text-[#7A6B80]">Choisissez une prestation pour réserver en ligne.</p>
            </div>
            <ProServicesList
              services={services}
              proSlug={pro.slug}
              proId={proId}
              catalogServices={catalog.services}
            />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading pro page:', error)
    notFound()
  }
}

