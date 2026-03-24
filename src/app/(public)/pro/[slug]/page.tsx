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
                    {/* Nom du professionnel - H1 SEO optimized */}
                    <h1 className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-2">
                      {(() => {
                        // Affichage public: "{Nom} – {Ville}" (ou "{Nom}" si ville absente)
                        if (pro.city) return `${pro.name} – ${pro.city}`
                        return pro.name
                      })()}
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

                    {/* Badge Portfolio */}
                    {(() => {
                      const hasInstagram = !!pro.socials?.instagram_url
                      const hasFacebook = !!pro.socials?.facebook_url
                      const hasPortfolio = hasInstagram || hasFacebook

                      if (!hasPortfolio) return null

                      return (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                            Portfolio
                          </span>
                          <div className="flex items-center gap-2">
                            {hasInstagram && (
                              <a
                                href={pro.socials.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Voir le portfolio Instagram"
                                className="text-[#E4405F] hover:opacity-80 transition-opacity"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                              </a>
                            )}
                            {hasFacebook && (
                              <a
                                href={pro.socials.facebook_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Voir le portfolio Facebook"
                                className="text-[#1877F2] hover:opacity-80 transition-opacity"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
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
              {PHOTOS_ENABLED && pro.gallery?.images && pro.gallery.images.length > 0 && (
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
          {PHOTOS_ENABLED && pro.gallery?.images && pro.gallery.images.length > 0 && (
            <ProGallery images={pro.gallery.images} />
          )}

          {/* 3bis. Section Portfolio (si photos désactivées mais réseaux sociaux présents) */}
          {pro.socials && (pro.socials.instagram_url || pro.socials.facebook_url) && (
            <div className="mb-12">
              <Card className="rounded-[32px] p-8 md:p-10">
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#2A1F2D] mb-3">
                    Portfolio
                  </h2>
                  <p className="text-slate-600 text-base md:text-lg">
                    📸 Mes photos sont disponibles sur mes réseaux.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  {pro.socials.instagram_url && (
                    <a
                      href={pro.socials.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-[24px] bg-gradient-to-r from-[#E4405F] to-[#C13584] text-white hover:shadow-lg transition-all font-medium"
                    >
                      <span className="text-lg">📷</span>
                      <span>Voir Instagram</span>
                    </a>
                  )}
                  {pro.socials.facebook_url && (
                    <a
                      href={pro.socials.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-[24px] bg-[#1877F2] text-white hover:shadow-lg transition-all font-medium"
                    >
                      <span className="text-lg">👥</span>
                      <span>Voir Facebook</span>
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-500 italic">
                  Astuce : vous pouvez ajouter vos liens dans votre fiche professionnelle.
                </p>
              </Card>
            </div>
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

