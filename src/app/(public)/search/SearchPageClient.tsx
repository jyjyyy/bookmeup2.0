'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { SearchPro, SearchService } from '@/app/api/pros/search/route'
import { calculateDistance, getCurrentPosition } from '@/lib/geolocation'

interface CitySuggestion {
  id: string
  name: string
  department: string
  region: string
  location: {
    lat: number
    lng: number
  }
}

interface SelectedCity {
  id: string
  name: string
  department: string
  location: {
    lat: number
    lng: number
  }
}

export function SearchPageClient() {
  const [pros, setPros] = useState<SearchPro[]>([])
  const [filteredPros, setFilteredPros] = useState<SearchPro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null)
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [loadingCitySuggestions, setLoadingCitySuggestions] = useState(false)
  const cityAutocompleteRef = useRef<HTMLDivElement>(null)
  const [selectedService, setSelectedService] = useState<string | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [radius, setRadius] = useState<5 | 10 | 20>(10) // Default 10km
  const [useLocation, setUseLocation] = useState(false)

  // Load pros on mount
  useEffect(() => {
    const loadPros = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/pros/search')
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des professionnels')
        }

        const data = await response.json()
        setPros(data.pros || [])
        setFilteredPros(data.pros || [])
      } catch (err: any) {
        console.error('Error loading pros:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadPros()
  }, [])

  // Fetch city autocomplete suggestions
  useEffect(() => {
    if (cityQuery.length < 2) {
      setCitySuggestions([])
      setShowCitySuggestions(false)
      return
    }

    const fetchSuggestions = async () => {
      setLoadingCitySuggestions(true)
      try {
        const response = await fetch(
          `/api/cities/autocomplete?q=${encodeURIComponent(cityQuery)}`
        )
        if (response.ok) {
          const data = await response.json()
          // Limit to 15 results (between 10-20)
          setCitySuggestions(data.slice(0, 15))
          setShowCitySuggestions(data.length > 0)
        }
      } catch (err) {
        console.error('Error fetching city suggestions:', err)
      } finally {
        setLoadingCitySuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [cityQuery])

  // Close city suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityAutocompleteRef.current && !cityAutocompleteRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCity = (city: CitySuggestion) => {
    setSelectedCity({
      id: city.id,
      name: city.name,
      department: city.department,
      location: city.location,
    })
    setCityQuery(city.name)
    setShowCitySuggestions(false)
  }

  const handleClearCity = () => {
    setSelectedCity(null)
    setCityQuery('')
    setCitySuggestions([])
    setShowCitySuggestions(false)
  }

  // Request geolocation
  const handleEnableLocation = async () => {
    try {
      setLocationLoading(true)
      setLocationError(null)
      const position = await getCurrentPosition()
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
      setUseLocation(true)
      // Clear city selection when using location
      handleClearCity()
    } catch (err: any) {
      setLocationError(err.message || 'Erreur de géolocalisation')
      setUseLocation(false)
    } finally {
      setLocationLoading(false)
    }
  }

  const handleDisableLocation = () => {
    setUseLocation(false)
    setUserLocation(null)
    setLocationError(null)
  }

  // Filter pros based on search term, city, service, and distance
  useEffect(() => {
    let filtered = [...pros]

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((pro) => {
        // Search in business_name
        if (pro.business_name?.toLowerCase().includes(term)) {
          return true
        }
        // Search in city
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

    // Filter by city (using cityName if available, fallback to city)
    // Skip if using location-based search
    if (selectedCity && !useLocation) {
      filtered = filtered.filter((pro) => {
        // Match by cityName (new field) or city (legacy field)
        return pro.cityName === selectedCity.name || pro.city === selectedCity.name
      })
    }

    // Filter by service
    if (selectedService !== 'all') {
      filtered = filtered.filter((pro) =>
        pro.services.some((service) => service.name === selectedService)
      )
    }

    // Filter by distance if using location
    if (useLocation && userLocation) {
      filtered = filtered
        .filter((pro) => {
          if (!pro.location?.lat || !pro.location?.lng) {
            return false // Skip pros without location data
          }
          
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            pro.location.lat,
            pro.location.lng
          )
          
          // Store distance for sorting
          pro.distance = distance
          
          return distance <= radius
        })
        .sort((a, b) => {
          // Sort by distance (closest first)
          const distanceA = a.distance || Infinity
          const distanceB = b.distance || Infinity
          return distanceA - distanceB
        })
    } else {
      // Clear distance when not using location
      filtered.forEach((pro) => {
        delete pro.distance
      })
    }

    setFilteredPros(filtered)
  }, [pros, searchTerm, selectedCity, selectedService, useLocation, userLocation, radius])

  // Extract unique service names
  const services = Array.from(
    new Set(pros.flatMap((p) => p.services.map((s) => s.name).filter(Boolean)))
  ).sort()

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

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une pro, une ville ou un service…"
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
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Location-based search toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {!useLocation ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleEnableLocation}
                disabled={locationLoading}
                className="rounded-[32px]"
              >
                {locationLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Géolocalisation...
                  </>
                ) : (
                  <>
                    📍 Autour de moi
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-[32px]">
                <span className="text-primary">📍 Autour de moi activé</span>
                <button
                  type="button"
                  onClick={handleDisableLocation}
                  className="text-primary hover:text-primary/70 transition-colors"
                  title="Désactiver la géolocalisation"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            
            {useLocation && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">
                  Rayon:
                </label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value) as 5 | 10 | 20)}
                  className="px-3 py-2 rounded-[24px] bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                </select>
              </div>
            )}
            
            {locationError && (
              <div className="text-sm text-red-600 px-3 py-2 bg-red-50 border border-red-200 rounded-[24px]">
                {locationError}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* City Filter - Autocomplete (disabled when using location) */}
            <div ref={cityAutocompleteRef} className="flex-1 min-w-[200px] relative">
              <div className="relative">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value)
                  setSelectedCity(null)
                  setShowCitySuggestions(true)
                }}
                onFocus={() => {
                  if (citySuggestions.length > 0 && !useLocation) {
                    setShowCitySuggestions(true)
                  }
                }}
                placeholder={useLocation ? "📍 Recherche par géolocalisation active" : "📍 Rechercher une ville..."}
                disabled={useLocation}
                className="w-full px-4 py-3 pr-10 rounded-[32px] bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 text-sm placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              {selectedCity && (
                <button
                  type="button"
                  onClick={handleClearCity}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Effacer la ville"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {loadingCitySuggestions && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  ...
                </div>
              )}
            </div>
            
            {showCitySuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-[24px] shadow-lg max-h-60 overflow-y-auto">
                {citySuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSelectCity(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors first:rounded-t-[24px] last:rounded-b-[24px]"
                  >
                    <div className="font-medium text-[#2A1F2D]">{suggestion.name}</div>
                    <div className="text-xs text-gray-500">
                      {suggestion.department} - {suggestion.region}
                    </div>
                  </button>
                ))}
              </div>
            )}
              </div>
            </div>

            {/* Service Filter */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as string | 'all')}
              className="w-full px-4 py-3 rounded-[32px] bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 text-sm"
            >
              <option value="all">✨ Tous les services</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {filteredPros.length > 0 && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">
            {filteredPros.length} professionnelle{filteredPros.length > 1 ? 's' : ''} trouvée{filteredPros.length > 1 ? 's' : ''}
          </p>
          {useLocation && userLocation && (
            <span className="text-xs text-gray-500">
              dans un rayon de {radius} km
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {filteredPros.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 text-lg">
            Aucune pro ne correspond à ta recherche pour le moment.
          </p>
          {(searchTerm || selectedCity || selectedService !== 'all' || useLocation) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                handleClearCity()
                setSelectedService('all')
                handleDisableLocation()
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
                      {pro.plan && (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            pro.plan === 'premium'
                              ? 'bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-700 border border-pink-200'
                              : pro.plan === 'pro'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {pro.plan === 'premium'
                            ? '⭐ Premium'
                            : pro.plan === 'pro'
                            ? '✨ Pro'
                            : 'Starter'}
                        </span>
                      )}
                    </div>

                    {pro.city && (
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-sm text-gray-600">
                          📍 {pro.city}
                        </p>
                        {pro.distance !== undefined && (
                          <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                            {pro.distance} km
                          </span>
                        )}
                      </div>
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
                      <Link href={`/pro/${pro.slug}`} className="block">
                        <Button
                          size="sm"
                          className="w-full rounded-[32px] text-sm"
                        >
                          Voir la fiche
                        </Button>
                      </Link>
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

