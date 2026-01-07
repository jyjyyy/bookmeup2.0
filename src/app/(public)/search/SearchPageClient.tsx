'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { SearchPro, SearchService } from '@/app/api/pros/search/route'
import { getCurrentUser } from '@/lib/auth'

interface CatalogService {
  id: string
  name: string
  category: string | null
}

export function SearchPageClient() {
  const router = useRouter()
  const [pros, setPros] = useState<SearchPro[]>([])
  const [filteredPros, setFilteredPros] = useState<SearchPro[]>([])
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | 'all'>('all')
  const [selectedServiceId, setSelectedServiceId] = useState<string | 'all'>('all')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load pros and services catalog on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load pros and services catalog in parallel
        const [prosResponse, catalogResponse] = await Promise.all([
          fetch('/api/pros/search'),
          fetch('/api/services/catalog'),
        ])
        
        if (!prosResponse.ok) {
          throw new Error('Erreur lors du chargement des professionnels')
        }

        if (!catalogResponse.ok) {
          console.warn('Failed to load services catalog, continuing without it')
        }

        const prosData = await prosResponse.json()
        setPros(prosData.pros || [])
        setFilteredPros(prosData.pros || [])

        if (catalogResponse.ok) {
          const catalogData = await catalogResponse.json()
          setCatalogServices(catalogData.services || [])
        }
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter pros based on search term, city, and service
  useEffect(() => {
    let filtered = [...pros]

    // Filter by search term (pro name OR service name OR city)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((pro) => {
        // Search in business_name
        if (pro.business_name?.toLowerCase().includes(term)) {
          return true
        }
        // Search in city (case-insensitive)
        if (pro.city?.toLowerCase().includes(term)) {
          return true
        }
        // Search in service names
        if (pro.services.some((service) => service.name?.toLowerCase().includes(term))) {
          return true
        }
        return false
      })
    }

    // Filter by city (case-insensitive, normalized)
    if (selectedCity !== 'all') {
      const normalizedCity = selectedCity.trim().toLowerCase()
      filtered = filtered.filter((pro) => {
        if (!pro.city) return false
        return pro.city.trim().toLowerCase() === normalizedCity
      })
    }

    // Filter by service (using serviceId from services_catalog)
    if (selectedServiceId !== 'all') {
      filtered = filtered.filter((pro) =>
        pro.services.some((service) => service.serviceId === selectedServiceId)
      )
    }

    setFilteredPros(filtered)
  }, [pros, searchTerm, selectedCity, selectedServiceId])

  // Extract unique cities (normalized, case-insensitive)
  const cities = Array.from(
    new Set(
      pros
        .map((p) => p.city?.trim())
        .filter(Boolean) as string[]
    )
  ).sort()

  // Extract services that are actively offered by visible PROs
  const availableServices = Array.from(
    new Map(
      pros
        .flatMap((pro) => pro.services)
        .filter((service): service is SearchService & { serviceId: string } => 
          Boolean(service.serviceId && service.name)
        )
        .map((service) => [service.serviceId, { id: service.serviceId, name: service.name }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  // Get suggestions based on search term
  const getSuggestions = () => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      return { cities: [], services: [] }
    }

    const term = searchTerm.toLowerCase().trim()
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

    const normalizedTerm = normalize(term)

    // Filter cities
    const matchingCities = cities
      .filter((city) => normalize(city).includes(normalizedTerm))
      .slice(0, 5)

    // Filter services (only those offered by visible PROs)
    const matchingServices = availableServices
      .filter((service) => normalize(service.name).includes(normalizedTerm))
      .slice(0, 5)

    return { cities: matchingCities, services: matchingServices }
  }

  const suggestions = getSuggestions()

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-12 text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Chargement des professionnelles...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 bg-red-50 border-red-200 text-center">
        <p className="text-red-700 font-medium">Erreur</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </Card>
    )
  }

  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const handleRemoveCityFilter = () => {
    setSelectedCity('all')
  }

  const handleRemoveServiceFilter = () => {
    setSelectedServiceId('all')
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="space-y-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowSuggestions(e.target.value.length >= 2)
            }}
            onFocus={() => {
              if (searchTerm.length >= 2) {
                setShowSuggestions(true)
              }
            }}
            placeholder="Rechercher un service ou une ville"
            className="w-full px-6 py-4 rounded-[32px] bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-bookmeup-sm text-gray-900 placeholder:text-gray-400"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.cities.length > 0 || suggestions.services.length > 0) && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-[16px] shadow-lg max-h-80 overflow-y-auto"
            >
              {suggestions.cities.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                    Villes
                  </div>
                  {suggestions.cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-900"
                    >
                      <span className="text-gray-400">📍</span>
                      <span>{city}</span>
                    </button>
                  ))}
                </div>
              )}

              {suggestions.services.length > 0 && (
                <div>
                  {suggestions.cities.length > 0 && (
                    <div className="border-t border-gray-100" />
                  )}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                    Services
                  </div>
                  {suggestions.services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceSelect(service.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-900"
                    >
                      <span className="text-gray-400">💅</span>
                      <span>{service.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Chips */}
        {(selectedCity !== 'all' || selectedServiceId !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {selectedCity !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm">
                <span>📍</span>
                <span>{selectedCity}</span>
                <button
                  type="button"
                  onClick={handleRemoveCityFilter}
                  className="ml-1 hover:text-primary/80 transition-colors"
                  aria-label="Retirer le filtre ville"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedServiceId !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm">
                <span>💅</span>
                <span>
                  {availableServices.find((s) => s.id === selectedServiceId)?.name ||
                    catalogServices.find((s) => s.id === selectedServiceId)?.name ||
                    'Service'}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveServiceFilter}
                  className="ml-1 hover:text-primary/80 transition-colors"
                  aria-label="Retirer le filtre service"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredPros.length > 0 && (
        <p className="text-sm text-gray-600">
          {filteredPros.length} professionnelle{filteredPros.length > 1 ? 's' : ''} trouvée{filteredPros.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Results */}
      {filteredPros.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 text-lg">
            Aucun professionnel trouvé
          </p>
          {(searchTerm || selectedCity !== 'all' || selectedServiceId !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCity('all')
                setSelectedServiceId('all')
              }}
              className="mt-4 rounded-[32px]"
            >
              Réinitialiser les filtres
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredPros.map((pro, index) => (
              <motion.div
                key={pro.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  hover
                  className="rounded-[32px] p-6 hover:shadow-bookmeup-lg transition-all duration-300"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900 flex-1 pr-2">
                        {pro.business_name}
                      </h3>
                    </div>

                    {pro.city && (
                      <p className="text-sm text-gray-600 mb-3">
                        📍 {pro.city}
                      </p>
                    )}
                  </div>

                  {/* Services List */}
                  {pro.services.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Services
                      </p>
                      <div className="space-y-1.5">
                        {pro.services.slice(0, 3).map((service) => (
                          <div
                            key={service.id}
                            className="text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span className="text-primary">•</span>
                            <span className="flex-1">{service.name}</span>
                            {service.price !== null && (
                              <span className="font-semibold text-primary">
                                {service.price}€
                              </span>
                            )}
                            {service.duration !== null && (
                              <span className="text-xs text-gray-500">
                                {service.duration}min
                              </span>
                            )}
                          </div>
                        ))}
                        {pro.services.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            + {pro.services.length - 3} autre{pro.services.length - 3 > 1 ? 's' : ''} service{pro.services.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100">
                    {pro.slug ? (
                      <Button
                        size="sm"
                        className="w-full rounded-[32px] text-sm"
                        onClick={async () => {
                          try {
                            const current = await getCurrentUser()
                            if (!current.user) {
                              router.push(
                                `/auth/login?redirect=/pro/${pro.slug}`
                              )
                              return
                            }
                            router.push(`/pro/${pro.slug}`)
                          } catch {
                            // En cas d'erreur, fallback vers la page de connexion
                            router.push(
                              `/auth/login?redirect=/pro/${pro.slug}`
                            )
                          }
                        }}
                      >
                        Voir la fiche
                      </Button>
                    ) : (
                      <Button
                        disabled
                        size="sm"
                        variant="outline"
                        className="w-full rounded-[32px] text-sm"
                      >
                        Profil indisponible
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

