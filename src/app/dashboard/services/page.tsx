'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
            Mes services
          </h1>
          <p className="text-sm text-[#7A6B80]">
            Gérez vos services et tarifs
          </p>
        </div>
        {proId && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="btn-gradient rounded-[14px] px-5 py-2.5 text-sm font-bold shadow-bookmeup-sm"
          >
            + Ajouter un service
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-red-700 font-semibold text-sm mb-0.5">Erreur</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReload}
            className="rounded-[12px] border-red-300 text-red-700 hover:bg-red-100 text-xs"
          >
            Réessayer
          </Button>
        </div>
      )}

      {services.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#EDE8F0] p-12 text-center shadow-bookmeup-sm">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-5 text-3xl">✨</div>
            <h3 className="text-base font-bold text-[#2A1F2D] mb-2">
              Aucun service pour le moment
            </h3>
            <p className="text-sm text-[#7A6B80] mb-6">
              Créez votre premier service pour commencer à accepter des réservations.
            </p>
            {proId && (
              <Button
                onClick={() => setAddModalOpen(true)}
                className="btn-gradient rounded-[14px] px-5 py-2.5 text-sm font-bold"
              >
                Créer votre premier service
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedServices.map((group) => {
            const isExpanded = expandedCategories.has(group.category)
            return (
              <div key={group.category} className="bg-white border border-[#EDE8F0] rounded-[20px] overflow-hidden shadow-bookmeup-sm">
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary transition-colors"
                >
                  <h2 className="text-sm font-bold text-[#2A1F2D]">
                    {group.category} <span className="text-[#7A6B80] font-normal">({group.services.length})</span>
                  </h2>
                  <svg
                    className={`w-4 h-4 text-[#7A6B80] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5 pt-2 border-t border-[#EDE8F0]">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence>
                        {group.services.map((service, index) => (
                          <motion.div
                            key={service.id}
                            suppressHydrationWarning
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="bg-background rounded-[16px] p-5 h-full flex flex-col border border-[#EDE8F0] hover:border-primary/30 transition-all">
                              <div className="mb-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-sm font-bold text-[#2A1F2D] flex-1 pr-2">
                                    {service.name}
                                  </h3>
                                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                                    service.isActive
                                      ? 'bg-[#DCFCE7] text-[#166534]'
                                      : 'bg-secondary text-[#7A6B80]'
                                  }`}>
                                    {service.isActive ? 'Actif' : 'Inactif'}
                                  </span>
                                </div>
                                {service.description && (
                                  <p className="text-xs text-[#7A6B80] line-clamp-2 leading-relaxed">
                                    {service.description}
                                  </p>
                                )}
                              </div>

                              <div className="mt-auto pt-3 border-t border-[#EDE8F0]">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xl font-extrabold text-primary">{service.price} €</span>
                                  <span className="text-xs text-[#7A6B80]">⏱ {service.duration} min</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(service)}
                                    className="flex-1 py-2 rounded-[10px] text-xs font-semibold bg-white border border-[#EDE8F0] text-[#2A1F2D] hover:border-primary hover:text-primary transition-all"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleDelete(service)}
                                    className="flex-1 py-2 rounded-[10px] text-xs font-semibold bg-white border border-[#EDE8F0] text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
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
