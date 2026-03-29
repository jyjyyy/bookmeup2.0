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

const inputStyles = "w-full px-4 py-3 rounded-[14px] border border-[#EDE8F0] bg-[#FDFBFE] text-[#2A1F2D] text-sm placeholder:text-[#B5A8BE] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all duration-200"
const labelStyles = "block text-xs font-semibold text-[#2A1F2D] mb-2 tracking-wide"

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

  const categories = useMemo(() => {
    return Array.from(
      new Set(catalogServices.map((s) => s.category).filter(Boolean))
    ).sort() as string[]
  }, [catalogServices])

  const servicesForSelectedType = useMemo(() => {
    if (!serviceType) return []
    return catalogServices.filter((s) => s.category === serviceType)
  }, [serviceType, catalogServices])

  const serviceTypeSuggestions = useMemo(() => {
    const term = serviceTypeInput.toLowerCase().trim()
    if (term) {
      return categories.filter((cat) =>
        cat.toLowerCase().includes(term)
      )
    } else {
      return categories
    }
  }, [serviceTypeInput, categories])

  const serviceNameSuggestions = useMemo(() => {
    if (!serviceType) return []

    const term = serviceNameInput.toLowerCase().trim()
    if (term) {
      return servicesForSelectedType.filter((s) =>
        s.name.toLowerCase().includes(term)
      )
    } else {
      return servicesForSelectedType
    }
  }, [serviceNameInput, serviceType, servicesForSelectedType])

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
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 bg-red-50/80 border border-red-200/60 text-red-600 px-4 py-3 rounded-[14px] text-sm">
            <div className="w-8 h-8 rounded-[8px] bg-red-100 flex items-center justify-center shrink-0 text-xs">⚠️</div>
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-1">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${serviceType ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[9px]">1</span>
            Type
          </div>
          <div className="w-4 h-px bg-[#EDE8F0]" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${selectedServiceId ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : serviceType ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-[#F5F0F7] text-[#B5A8BE] border border-[#EDE8F0]'}`}>
            <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[9px]">2</span>
            Service
          </div>
          <div className="w-4 h-px bg-[#EDE8F0]" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${price ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : selectedServiceId ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-[#F5F0F7] text-[#B5A8BE] border border-[#EDE8F0]'}`}>
            <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[9px]">3</span>
            Détails
          </div>
        </div>

        {/* 1. Service type (category) */}
        <div ref={serviceTypeRef} className="relative">
          <label className={labelStyles}>
            Type de service <span className="text-primary">*</span>
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
            className={inputStyles}
          />
          {showServiceTypeSuggestions && serviceTypeSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1.5 bg-white border border-[#EDE8F0] rounded-[14px] shadow-[0_8px_32px_rgba(20,0,50,0.1)] max-h-52 overflow-y-auto">
              {serviceTypeSuggestions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleServiceTypeSelect(category)}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#F5F0F7] text-sm text-[#2A1F2D] first:rounded-t-[14px] last:rounded-b-[14px] transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Service name */}
        <div ref={serviceNameRef} className="relative">
          <label className={labelStyles}>
            Nom du service <span className="text-primary">*</span>
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
            className={`${inputStyles} disabled:bg-[#F5F0F7] disabled:text-[#B5A8BE] disabled:cursor-not-allowed`}
          />
          {showServiceNameSuggestions && serviceNameSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1.5 bg-white border border-[#EDE8F0] rounded-[14px] shadow-[0_8px_32px_rgba(20,0,50,0.1)] max-h-52 overflow-y-auto">
              {serviceNameSuggestions.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceNameSelect(service)}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#F5F0F7] text-sm text-[#2A1F2D] first:rounded-t-[14px] last:rounded-b-[14px] transition-colors"
                >
                  {service.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Description */}
        <div>
          <label className={labelStyles}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            className={`${inputStyles} resize-none`}
            placeholder="Décrivez votre service..."
          />
        </div>

        {/* 4. Price & Duration row */}
        <div className="grid grid-cols-2 gap-3">
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

          <div>
            <label className={labelStyles}>
              Durée <span className="text-primary">*</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
              className={`${inputStyles} pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%239A8DA3%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')] bg-[length:1.1rem] bg-[right_0.8rem_center] bg-no-repeat`}
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

        {/* Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-3 rounded-full text-sm font-semibold border border-[#EDE8F0] text-[#2A1F2D] hover:bg-[#F5F0F7] transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-full text-sm font-bold btn-gradient shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_6px_24px_rgba(200,109,215,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le service'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
