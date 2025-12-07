'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
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
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proId, setProId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

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
    } catch (error: any) {
      console.error('[Dashboard Services] Error reloading services:', error)
      setError(error.message || 'Erreur lors du rechargement des services')
    }
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setEditModalOpen(true)
  }

  const handleDelete = (service: Service) => {
    setSelectedService(service)
    setDeleteModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Mes services</h1>
          <p className="text-gray-600">
            Gérez vos services et tarifs
          </p>
        </div>
        {proId && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="rounded-[32px]"
          >
            + Ajouter un service
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 font-medium">Erreur</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              className="rounded-[32px]"
            >
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card className="rounded-[32px] p-12 text-center">
          <p className="text-gray-500 mb-4">
            Vous n'avez pas encore de services.
          </p>
          {proId && (
            <Button
              onClick={() => setAddModalOpen(true)}
              variant="outline"
              className="rounded-[32px]"
            >
              Créer votre premier service
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-[32px] p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            service.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {service.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
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

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(service)}
                      className="flex-1 rounded-[32px] text-sm"
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(service)}
                      className="flex-1 rounded-[32px] text-sm text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Supprimer
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
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
