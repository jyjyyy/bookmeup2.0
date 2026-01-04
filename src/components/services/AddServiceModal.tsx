'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ServiceSuggestion {
  id: string
  name: string
  category: string
}

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  proId: string
}

// Available service categories with French labels
const SERVICE_CATEGORIES = [
  { value: 'ongles', label: 'Ongles' },
  { value: 'coiffure_femme', label: 'Coiffure Femme' },
  { value: 'coiffure_homme', label: 'Coiffure Homme' },
  { value: 'coiffure_enfant', label: 'Coiffure Enfant' },
  { value: 'regard', label: 'Regard' },
  { value: 'soins_visage', label: 'Soins du Visage' },
  { value: 'soins_corps', label: 'Soins du Corps' },
  { value: 'massages', label: 'Massages' },
  { value: 'épilation', label: 'Épilation' },
  { value: 'maquillage', label: 'Maquillage' },
  { value: 'services_spécifiques', label: 'Services Spécifiques' },
]

export function AddServiceModal({
  isOpen,
  onClose,
  onSuccess,
  proId,
}: AddServiceModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [serviceQuery, setServiceQuery] = useState('')
  const [selectedService, setSelectedService] = useState<ServiceSuggestion | null>(null)
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Fetch autocomplete suggestions
  useEffect(() => {
    // Require category to be selected before searching
    if (!selectedCategory || serviceQuery.length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true)
      try {
        // Filter by category if selected
        const url = `/api/services/autocomplete?q=${encodeURIComponent(serviceQuery)}&category=${encodeURIComponent(selectedCategory)}`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          // API already filters by category, but we can double-check client-side
          const filtered = data.filter((service: ServiceSuggestion) => service.category === selectedCategory)
          setSuggestions(filtered)
          setShowSuggestions(filtered.length > 0)
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err)
      } finally {
        setLoadingSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [serviceQuery, selectedCategory])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    // Reset service selection when category changes
    setSelectedService(null)
    setServiceQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSelectService = (service: ServiceSuggestion) => {
    setSelectedService(service)
    setServiceQuery(service.name)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedCategory) {
      setError('Veuillez sélectionner un type de service')
      return
    }

    if (!selectedService) {
      setError('Veuillez sélectionner un service dans le catalogue')
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
          serviceId: selectedService.id, // Send catalog serviceId (slug)
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
      setSelectedCategory('')
      setServiceQuery('')
      setSelectedService(null)
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
      setSelectedCategory('')
      setServiceQuery('')
      setSelectedService(null)
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

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de service <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionner un type de service</option>
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Service Autocomplete - Only enabled when category is selected */}
        <div ref={autocompleteRef} className="relative">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service (recherche dans le catalogue)
            </label>
            <Input
              type="text"
              value={serviceQuery}
              onChange={(e) => {
                setServiceQuery(e.target.value)
                setSelectedService(null)
                setShowSuggestions(true)
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              required
              disabled={loading || !selectedCategory}
              placeholder={selectedCategory ? "Rechercher un service..." : "Choisissez un type de service"}
            />
            {!selectedCategory && (
              <p className="mt-1 text-xs text-gray-500">
                Choisissez un type de service ci-dessus pour activer la recherche
              </p>
            )}
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[24px] shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleSelectService(service)}
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors first:rounded-t-[24px] last:rounded-b-[24px]"
                >
                  <div className="font-medium text-[#2A1F2D]">{service.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{service.category.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          )}
          
          {loadingSuggestions && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              Recherche...
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-4 py-3 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Décrivez votre service..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Prix (€)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
            min="0"
            step="0.01"
            placeholder="45"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
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

