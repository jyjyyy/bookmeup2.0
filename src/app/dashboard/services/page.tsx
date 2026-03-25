'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ServicesSkeleton } from '@/components/ui/skeleton'
import { AddServiceModal } from '@/components/services/AddServiceModal'
import { EditServiceModal } from '@/components/services/EditServiceModal'
import { DeleteServiceModal } from '@/components/services/DeleteServiceModal'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  isActive: boolean
  serviceId?: string | null
}

interface CatalogService {
  id: string
  name: string
  category: string | null
}

interface GroupedServices {
  category: string
  services: Service[]
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proId, setProId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadServices = async () => {
      try {
        setError(null)
        setLoading(true)

        // Get current user to get proId
        const currentUser = await getCurrentUser()
        
        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/search')
          return
        }

        // Check subscription status
        const subscriptionStatus = await checkSubscriptionStatus(currentUser.user.uid)
        
        if (!subscriptionStatus.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
          return
        }

        const uid = currentUser.user.uid
        console.log('[Dashboard Services] Loading services for proId:', uid)
        setProId(uid)

        // Fetch services
        const response = await fetch(`/api/services/list?proId=${uid}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || `Erreur ${response.status}: Impossible de charger les services`
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log('[Dashboard Services] Loaded', data.services?.length || 0, 'services')
        setServices(data.services || [])

        // Load services catalog to get categories
        try {
          const catalogResponse = await fetch('/api/services/catalog')
          if (catalogResponse.ok) {
            const catalogData = await catalogResponse.json()
            setCatalogServices(catalogData.services || [])
          }
        } catch (catalogErr) {
          console.warn('[Dashboard Services] Failed to load services catalog:', catalogErr)
        }
      } catch (error: any) {
        console.error('[Dashboard Services] Error loading services:', error)
        setError(error.message || 'Une erreur est survenue lors du chargement des services')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [router])

  const handleReload = async () => {
    if (!proId) return

    try {
      setError(null)
      console.log('[Dashboard Services] Reloading services for proId:', proId)
      const response = await fetch(`/api/services/list?proId=${proId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Erreur lors du rechargement'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('[Dashboard Services] Reloaded', data.services?.length || 0, 'services')
      setServices(data.services || [])

      // Reload services catalog
      try {
        const catalogResponse = await fetch('/api/services/catalog')
        if (catalogResponse.ok) {
          const catalogData = await catalogResponse.json()
          setCatalogServices(catalogData.services || [])
        }
      } catch (catalogErr) {
        console.warn('[Dashboard Services] Failed to reload services catalog:', catalogErr)
      }
    } catch (error: any) {
      console.error('[Dashboard Services] Error reloading services:', error)
      setError(error.message || 'Erreur lors du rechargement des services')
    }
  }

  // Group services by category (reusable logic)
  const groupedServices = useMemo(() => {
    // Create a map of serviceId -> category
    const categoryMap = new Map<string, string>()
    catalogServices.forEach((catalogService) => {
      if (catalogService.category) {
        categoryMap.set(catalogService.id, catalogService.category)
      }
    })

    // Group services by category
    const groups = new Map<string, Service[]>()
    const uncategorized: Service[] = []

    services.forEach((service) => {
      const category = service.serviceId ? categoryMap.get(service.serviceId) : null
      
      if (category) {
        if (!groups.has(category)) {
          groups.set(category, [])
        }
        groups.get(category)!.push(service)
      } else {
        uncategorized.push(service)
      }
    })

    // Convert to array and sort
    const result: GroupedServices[] = []
    
    // Add categorized groups (sorted alphabetically)
    const sortedCategories = Array.from(groups.keys()).sort()
    sortedCategories.forEach((category) => {
      const categoryServices = groups.get(category)!
      // Sort services within category alphabetically
      categoryServices.sort((a, b) => a.name.localeCompare(b.name))
      result.push({ category, services: categoryServices })
    })

    // Add uncategorized services if any
    if (uncategorized.length > 0) {
      uncategorized.sort((a, b) => a.name.localeCompare(b.name))
      result.push({ category: 'Autres', services: uncategorized })
    }

    return result
  }, [services, catalogServices])

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setEditModalOpen(true)
  }

  const handleDelete = (service: Service) => {
    setSelectedService(service)
    setDeleteModalOpen(true)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  if (loading) {
    return <ServicesSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Header amélioré */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-2">
            Mes services
          </h1>
          <p className="text-base text-slate-600">
            Gérez vos services et tarifs
          </p>
        </div>
        {proId && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="rounded-[32px] px-6 py-3 shadow-bookmeup hover:shadow-bookmeup-lg transition-all"
          >
            + Ajouter un service
          </Button>
        )}
      </div>

      {/* Error Message amélioré */}
      {error && (
        <Card className="rounded-[32px] bg-red-50 border-2 border-red-200 p-6 shadow-bookmeup-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-red-700 font-semibold mb-1">Erreur</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              className="rounded-[32px] border-red-300 text-red-700 hover:bg-red-100"
            >
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Services Grid amélioré */}
      {services.length === 0 ? (
        <Card className="rounded-[32px] p-12 md:p-16 text-center shadow-bookmeup">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-xl font-semibold text-[#2A1F2D] mb-3">
              Aucun service pour le moment
            </h3>
            <p className="text-slate-600 mb-6">
              Vous n'avez pas encore de services. Créez votre premier service pour commencer à accepter des réservations.
            </p>
            {proId && (
              <Button
                onClick={() => setAddModalOpen(true)}
                className="rounded-[32px] px-6 py-3 shadow-bookmeup hover:shadow-bookmeup-lg transition-all"
              >
                Créer votre premier service
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedServices.map((group) => {
            const isExpanded = expandedCategories.has(group.category)
            return (
              <div key={group.category} className="border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-bookmeup-sm">
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <h2 className="text-xl font-semibold text-[#2A1F2D]">
                    {group.category} ({group.services.length})
                  </h2>
                  <svg
                    className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 pt-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
                        {group.services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-[32px] p-6 h-full flex flex-col shadow-bookmeup hover:shadow-bookmeup-lg transition-all duration-300 border border-white/70 bg-white/90">
                  {/* En-tête avec nom et statut */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-[#2A1F2D] flex-1 pr-2">
                        {service.name}
                      </h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                          service.isActive
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {service.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    {service.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Prix et durée */}
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Prix</p>
                        <span className="text-3xl font-bold text-primary">
                          {service.price} €
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Durée</p>
                        <p className="text-lg font-semibold text-[#2A1F2D]">
                          {service.duration} min
                        </p>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(service)}
                        className="flex-1 rounded-[32px] text-sm font-medium hover:bg-secondary transition-colors"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(service)}
                        className="flex-1 rounded-[32px] text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {proId && (
        <>
          <AddServiceModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSuccess={handleReload}
            proId={proId}
          />

          <EditServiceModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedService(null)
            }}
            onSuccess={handleReload}
            service={selectedService}
          />

          <DeleteServiceModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false)
              setSelectedService(null)
            }}
            onSuccess={handleReload}
            serviceName={selectedService?.name || ''}
            serviceId={selectedService?.id || ''}
          />
        </>
      )}
    </div>
  )
}
