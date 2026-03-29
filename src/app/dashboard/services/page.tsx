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

const categoryIcons: Record<string, string> = {
  'Coiffure': '✂️',
  'Esthétique': '💅',
  'Massage': '💆',
  'Maquillage': '💄',
  'Onglerie': '💅',
  'Épilation': '🪒',
  'Soins': '🧴',
  'Barbier': '🪒',
  'Autres': '📦',
}

function getCategoryIcon(category: string) {
  return categoryIcons[category] || '✨'
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

        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/search')
          return
        }

        const subscriptionStatus = await checkSubscriptionStatus(currentUser.user.uid)

        if (!subscriptionStatus.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
          return
        }

        const uid = currentUser.user.uid
        console.log('[Dashboard Services] Loading services for proId:', uid)
        setProId(uid)

        const response = await fetch(`/api/services/list?proId=${uid}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || `Erreur ${response.status}: Impossible de charger les services`
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log('[Dashboard Services] Loaded', data.services?.length || 0, 'services')
        setServices(data.services || [])

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

  const groupedServices = useMemo(() => {
    const categoryMap = new Map<string, string>()
    catalogServices.forEach((catalogService) => {
      if (catalogService.category) {
        categoryMap.set(catalogService.id, catalogService.category)
      }
    })

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

    const result: GroupedServices[] = []

    const sortedCategories = Array.from(groups.keys()).sort()
    sortedCategories.forEach((category) => {
      const categoryServices = groups.get(category)!
      categoryServices.sort((a, b) => a.name.localeCompare(b.name))
      result.push({ category, services: categoryServices })
    })

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

  const totalServices = services.length
  const activeServices = services.filter(s => s.isActive).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Services
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-2xl font-extrabold text-[#2A1F2D] mb-1"
          >
            Mes services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-sm text-[#8a7a92]"
          >
            Gérez vos services et tarifs proposés à vos clientes.
          </motion.p>
        </div>
        {proId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Button
              onClick={() => setAddModalOpen(true)}
              className="btn-gradient rounded-full px-7 py-3 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_8px_28px_rgba(200,109,215,0.4)] transition-all hover:-translate-y-0.5"
            >
              <span className="mr-2 text-base">+</span> Ajouter un service
            </Button>
          </motion.div>
        )}
      </div>

      {/* Stats bar */}
      {totalServices > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white border border-primary/8 shadow-[0_2px_8px_rgba(20,0,50,0.03)]">
            <div className="w-7 h-7 rounded-[8px] bg-[#F5F0F7] flex items-center justify-center text-xs">📋</div>
            <span className="text-sm font-bold text-[#2A1F2D]">{totalServices}</span>
            <span className="text-xs text-[#8a7a92]">service{totalServices > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white border border-primary/8 shadow-[0_2px_8px_rgba(20,0,50,0.03)]">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-bold text-[#2A1F2D]">{activeServices}</span>
            <span className="text-xs text-[#8a7a92]">actif{activeServices > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white border border-primary/8 shadow-[0_2px_8px_rgba(20,0,50,0.03)]">
            <div className="w-2 h-2 rounded-full bg-[#C5BAD0]" />
            <span className="text-sm font-bold text-[#2A1F2D]">{totalServices - activeServices}</span>
            <span className="text-xs text-[#8a7a92]">inactif{(totalServices - activeServices) > 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/80 border border-red-200/60 rounded-[18px] p-5 flex items-center justify-between gap-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-[12px] bg-red-100 flex items-center justify-center text-lg shrink-0">⚠️</div>
            <div>
              <p className="text-red-700 font-semibold text-sm mb-0.5">Erreur de chargement</p>
              <p className="text-red-600/80 text-xs">{error}</p>
            </div>
          </div>
          <button
            onClick={handleReload}
            className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors shrink-0"
          >
            Réessayer
          </button>
        </motion.div>
      )}

      {/* Empty state */}
      {services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-[28px] border border-primary/10 p-16 text-center shadow-[0_8px_40px_rgba(20,0,50,0.05)]"
        >
          <div className="max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_4px_16px_rgba(200,109,215,0.1)]">
              ✨
            </div>
            <h3 className="text-xl font-extrabold text-[#2A1F2D] mb-2">
              Aucun service pour le moment
            </h3>
            <p className="text-sm text-[#8a7a92] mb-8 leading-relaxed">
              Créez votre premier service pour commencer à accepter des réservations de vos clientes.
            </p>
            {proId && (
              <Button
                onClick={() => setAddModalOpen(true)}
                className="btn-gradient rounded-full px-8 py-3 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_8px_28px_rgba(200,109,215,0.4)] transition-all hover:-translate-y-0.5"
              >
                Créer votre premier service
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {groupedServices.map((group, groupIndex) => {
            const isExpanded = expandedCategories.has(group.category)
            return (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: groupIndex * 0.08 }}
                className="bg-white border border-primary/8 rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(20,0,50,0.04)] hover:shadow-[0_6px_30px_rgba(20,0,50,0.06)] transition-shadow"
              >
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#FDFBFE] transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-primary/8 to-secondary flex items-center justify-center text-lg">
                      {getCategoryIcon(group.category)}
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-bold text-[#2A1F2D]">
                        {group.category}
                      </h2>
                      <p className="text-xs text-[#8a7a92] mt-0.5">
                        {group.services.length} service{group.services.length > 1 ? 's' : ''}
                        {' · '}
                        {group.services.filter(s => s.isActive).length} actif{group.services.filter(s => s.isActive).length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5">
                      {group.services.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-emerald-400' : 'bg-[#D5CCD9]'}`}
                        />
                      ))}
                      {group.services.length > 3 && (
                        <span className="text-[10px] text-[#8a7a92] ml-0.5">+{group.services.length - 3}</span>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-[#9A8DA3] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} group-hover:text-primary`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded services */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6 pt-2 border-t border-[#EDE8F0]/60">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence>
                        {group.services.map((service, index) => (
                          <motion.div
                            key={service.id}
                            suppressHydrationWarning
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ delay: index * 0.04, duration: 0.3 }}
                          >
                            <div className="group/card bg-[#FDFBFE] rounded-[20px] p-5 h-full flex flex-col border border-[#EDE8F0] hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(200,109,215,0.08)] transition-all duration-300">
                              {/* Top row: name + status */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-[15px] font-bold text-[#2A1F2D] truncate">
                                    {service.name}
                                  </h3>
                                </div>
                                <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 ${
                                  service.isActive
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                    : 'bg-[#F5F0F7] text-[#8a7a92] border border-[#EDE8F0]'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? 'bg-emerald-400' : 'bg-[#C5BAD0]'}`} />
                                  {service.isActive ? 'Actif' : 'Inactif'}
                                </span>
                              </div>

                              {/* Description */}
                              {service.description && (
                                <p className="text-xs text-[#8a7a92] line-clamp-2 leading-relaxed mb-4">
                                  {service.description}
                                </p>
                              )}

                              {/* Price + duration */}
                              <div className="mt-auto">
                                <div className="flex items-end justify-between mb-4 pt-3 border-t border-[#EDE8F0]/60">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-[#8a7a92] mb-0.5 font-medium">Prix</p>
                                    <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-[#9C44AF] bg-clip-text text-transparent">
                                      {service.price} €
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F0F7]">
                                    <svg className="w-3.5 h-3.5 text-[#9C44AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-[#2A1F2D]">{service.duration} min</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(service)}
                                    className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-white border border-[#EDE8F0] text-[#2A1F2D] hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleDelete(service)}
                                    className="py-2.5 px-4 rounded-full text-xs font-semibold bg-white border border-[#EDE8F0] text-red-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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
              </motion.div>
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
