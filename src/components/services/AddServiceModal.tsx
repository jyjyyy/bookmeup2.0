'use client'

import { useState, useEffect, useMemo, FormEvent, useRef } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CatalogService {
  id: string
  name: string
  category: string | null
}

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  proId: string
}

export function AddServiceModal({
  isOpen,
  onClose,
  onSuccess,
  proId,
}: AddServiceModalProps) {
  const [serviceType, setServiceType] = useState('')
  const [serviceTypeInput, setServiceTypeInput] = useState('')
  const [showServiceTypeSuggestions, setShowServiceTypeSuggestions] = useState(false)

  const [serviceName, setServiceName] = useState('')
  const [serviceNameInput, setServiceNameInput] = useState('')
  const [showServiceNameSuggestions, setShowServiceNameSuggestions] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([])

  const serviceTypeRef = useRef<HTMLDivElement>(null)
  const serviceNameRef = useRef<HTMLDivElement>(null)

  // Load services catalog on mount
  useEffect(() => {
    if (isOpen) {
      const loadCatalog = async () => {
        try {
          const response = await fetch('/api/services/catalog')
          if (response.ok) {
            const data = await response.json()
            setCatalogServices(data.services || [])
          }
        } catch (err) {
          console.error('Error loading services catalog:', err)
        }
      }
      loadCatalog()
    }
  }, [isOpen])

  // Extract unique categories
  const categories = useMemo(() => {
    return Array.from(
      new Set(catalogServices.map((s) => s.category).filter(Boolean))
    ).sort() as string[]
  }, [catalogServices])

  // Get services for selected type
  const servicesForSelectedType = useMemo(() => {
    if (!serviceType) return []
    return catalogServices.filter((s) => s.category === serviceType)
  }, [serviceType, catalogServices])

  // Filter service type suggestions (derived value)
  const serviceTypeSuggestions = useMemo(() => {
    const term = serviceTypeInput.toLowerCase().trim()
    if (term) {
      // Filter based on input
      return categories.filter((cat) =>
        cat.toLowerCase().includes(term)
      )
    } else {
      // Show all categories when input is empty
      return categories
    }
  }, [serviceTypeInput, categories])

  // Filter service name suggestions (derived value)
  const serviceNameSuggestions = useMemo(() => {
    if (!serviceType) return []

    const term = serviceNameInput.toLowerCase().trim()
    if (term) {
      // Filter based on input
      return servicesForSelectedType.filter((s) =>
        s.name.toLowerCase().includes(term)
      )
    } else {
      // Show all services when input is empty
      return servicesForSelectedType
    }
  }, [serviceNameInput, serviceType, servicesForSelectedType])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        serviceTypeRef.current &&
        !serviceTypeRef.current.contains(event.target as Node)
      ) {
        setShowServiceTypeSuggestions(false)
      }
      if (
        serviceNameRef.current &&
        !serviceNameRef.current.contains(event.target as Node)
      ) {
        setShowServiceNameSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleServiceTypeSelect = (category: string) => {
    setServiceType(category)
    setServiceTypeInput(category)
    setShowServiceTypeSuggestions(false)
    // Clear service name when type changes
    setServiceName('')
    setServiceNameInput('')
    setSelectedServiceId(null)
  }

  const handleServiceNameSelect = (service: CatalogService) => {
    setServiceName(service.name)
    setServiceNameInput(service.name)
    setSelectedServiceId(service.id)
    setShowServiceNameSuggestions(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!serviceType.trim()) {
      setError('Le type de service est requis')
      return
    }

    if (!serviceName.trim() || !selectedServiceId) {
      setError('Veuillez sélectionner un service valide dans la liste')
      return
    }

    if (!price || Number(price) <= 0) {
      setError('Le prix doit être supérieur à 0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/services/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proId,
          name: serviceName,
          serviceId: selectedServiceId,
          description,
          price: Number(price),
          duration: Number(duration),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.limitReached) {
          setError(
            'Vous avez atteint la limite de votre abonnement Starter (15 services maximum).'
          )
        } else {
          setError(data.error || 'Erreur lors de la création du service')
        }
        setLoading(false)
        return
      }

      // Reset form
      setServiceType('')
      setServiceTypeInput('')
      setServiceName('')
      setServiceNameInput('')
      setSelectedServiceId(null)
      setDescription('')
      setPrice('')
      setDuration('30')
      setError('')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du service')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setServiceType('')
      setServiceTypeInput('')
      setServiceName('')
      setServiceNameInput('')
      setSelectedServiceId(null)
      setDescription('')
      setPrice('')
      setDuration('30')
      setError('')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter un service">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
            {error}
          </div>
        )}

        {/* 1. Service type (category) */}
        <div ref={serviceTypeRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de service *
          </label>
          <input
            type="text"
            name="service-type-input"
            autoComplete="off"
            value={serviceTypeInput}
            onChange={(e) => {
              setServiceTypeInput(e.target.value)
              setServiceType('')
              setShowServiceTypeSuggestions(true)
            }}
            onFocus={() => {
              setShowServiceTypeSuggestions(true)
            }}
            disabled={loading}
            required
            placeholder="Tapez pour rechercher un type..."
            className="w-full px-4 py-3 rounded-[32px] border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          {showServiceTypeSuggestions && serviceTypeSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[16px] shadow-lg max-h-60 overflow-y-auto">
              {serviceTypeSuggestions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleServiceTypeSelect(category)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900"
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Service name */}
        <div ref={serviceNameRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du service *
          </label>
          <input
            type="text"
            name="service-name-input"
            autoComplete="off"
            value={serviceNameInput}
            onChange={(e) => {
              setServiceNameInput(e.target.value)
              setServiceName('')
              setSelectedServiceId(null)
              if (serviceType) {
                setShowServiceNameSuggestions(true)
              }
            }}
            onFocus={() => {
              if (serviceType) {
                setShowServiceNameSuggestions(true)
              }
            }}
            disabled={loading || !serviceType}
            required
            placeholder={
              serviceType
                ? "Tapez pour rechercher un service..."
                : "Sélectionnez d'abord un type de service"
            }
            className="w-full px-4 py-3 rounded-[32px] border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
          />
          {showServiceNameSuggestions && serviceNameSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[16px] shadow-lg max-h-60 overflow-y-auto">
              {serviceNameSuggestions.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceNameSelect(service)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900"
                >
                  {service.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-4 py-3 rounded-[32px] border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-gray-400"
            placeholder="Décrivez votre service..."
          />
        </div>

        {/* 4. Price */}
        <div>
          <Input
            type="number"
            label="Prix (€) *"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
            min="0"
            step="0.01"
            placeholder="45"
          />
        </div>

        {/* 5. Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Durée (minutes) *
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 pr-10 rounded-[32px] border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Création...' : 'Créer le service'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

