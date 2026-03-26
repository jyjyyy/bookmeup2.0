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

type ProsSearchResponse = { pros?: SearchPro[] }

// Dev/StrictMode can mount/unmount/remount quickly. This module-level cache
// prevents duplicate network calls while keeping the UI logic unchanged.
let prosSearchPromise: Promise<ProsSearchResponse> | null = null
let prosSearchController: AbortController | null = null
let prosSearchSubscribers = 0
let prosSearchAbortTimeout: ReturnType<typeof setTimeout> | null = null

export function SearchPageClient() {
  const router = useRouter()
  const [pros, setPros] = useState<SearchPro[]>([])
  const [filteredPros, setFilteredPros] = useState<SearchPro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | 'all'>('all')
  const [selectedServiceId, setSelectedServiceId] = useState<string | 'all'>('all')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const didFetchRef = useRef(false)
  const inFlightRef = useRef(false)
  const isMountedRef = useRef(false)

  // Load pros on mount (avoid duplicate calls in dev/StrictMode)
  useEffect(() => {
    isMountedRef.current = true
    prosSearchSubscribers += 1
    if (prosSearchAbortTimeout) {
      clearTimeout(prosSearchAbortTimeout)
      prosSearchAbortTimeout = null
    }

    // Guard: never start a second automatic fetch in this mounted instance.
    if (didFetchRef.current || inFlightRef.current) {
      return () => {
        isMountedRef.current = false
        prosSearchSubscribers -= 1
      }
    }

    didFetchRef.current = true
    inFlightRef.current = true

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Deduplicate network call across dev/StrictMode remounts.
        if (!prosSearchPromise) {
          prosSearchController = new AbortController()
          prosSearchPromise = fetch('/api/pros/search', {
            signal: prosSearchController.signal,
          }).then(async (res) => {
            if (!res.ok) {
              throw new Error('Erreur lors du chargement des professionnels')
            }
            return (await res.json()) as ProsSearchResponse
          })
        }

        const prosData = await prosSearchPromise

        if (!isMountedRef.current) return
        const list = prosData.pros || []
        setPros(list)
        setFilteredPros(list)
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error('Error loading data:', err)
        if (isMountedRef.current) {
          setError(err.message || 'Erreur lors du chargement')
        }
      } finally {
        inFlightRef.current = false
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMountedRef.current = false
      prosSearchSubscribers -= 1
      // Abort only when leaving the page for real (no subscribers left).
      // StrictMode dev "fake unmount" remounts immediately and cancels this.
      if (prosSearchSubscribers <= 0) {
        prosSearchAbortTimeout = setTimeout(() => {
          if (prosSearchSubscribers <= 0) {
            prosSearchController?.abort()
            prosSearchController = null
            prosSearchPromise = null
          }
        }, 250)
      }
    }
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-[#7A6B80] text-sm">Chargement des professionnels…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-[20px] text-center">
        <p className="text-red-700 font-semibold">Erreur</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
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
    <div className="space-y-6">
      {/* Search Bar + filters */}
      <div className="space-y-3">
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
              if (searchTerm.length >= 2) setShowSuggestions(true)
            }}
            placeholder="Rechercher un service, une ville ou un professionnel…"
            className="w-full px-5 py-4 rounded-[20px] bg-white border-2 border-[#EDE8F0] focus:outline-none focus:border-primary shadow-bookmeup-sm text-[#2A1F2D] placeholder:text-[#7A6B80] text-sm transition-colors"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-[#7A6B80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.cities.length > 0 || suggestions.services.length > 0) && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-2 bg-white border border-[#EDE8F0] rounded-[18px] shadow-bookmeup max-h-72 overflow-y-auto"
            >
              {suggestions.cities.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-[#7A6B80] uppercase tracking-wider bg-background border-b border-[#EDE8F0] rounded-t-[18px]">
                    Villes
                  </div>
                  {suggestions.cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center gap-3 text-[#2A1F2D] text-sm transition-colors"
                    >
                      <span>📍</span>
                      <span>{city}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.services.length > 0 && (
                <div>
                  {suggestions.cities.length > 0 && <div className="border-t border-[#EDE8F0]" />}
                  <div className="px-4 py-2 text-xs font-bold text-[#7A6B80] uppercase tracking-wider bg-background border-b border-[#EDE8F0]">
                    Services
                  </div>
                  {suggestions.services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceSelect(service.id)}
                      className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center gap-3 text-[#2A1F2D] text-sm transition-colors"
                    >
                      <span>✨</span>
                      <span>{service.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {(selectedCity !== 'all' || selectedServiceId !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {selectedCity !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">
                <span>📍</span>
                <span>{selectedCity}</span>
                <button type="button" onClick={handleRemoveCityFilter} className="ml-1 hover:opacity-75 transition-opacity" aria-label="Retirer le filtre ville">✕</button>
              </span>
            )}
            {selectedServiceId !== 'all' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">
                <span>✨</span>
                <span>{availableServices.find((s) => s.id === selectedServiceId)?.name || 'Service'}</span>
                <button type="button" onClick={handleRemoveServiceFilter} className="ml-1 hover:opacity-75 transition-opacity" aria-label="Retirer le filtre service">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredPros.length > 0 && (
        <p className="text-sm text-[#7A6B80]">
          <strong className="text-[#2A1F2D]">{filteredPros.length} professionnel{filteredPros.length > 1 ? 's' : ''}</strong> trouvé{filteredPros.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Results grid */}
      {filteredPros.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#EDE8F0] shadow-bookmeup-sm">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-[#2A1F2D] font-semibold text-lg mb-2">Aucun professionnel trouvé</p>
          <p className="text-[#7A6B80] text-sm mb-6">Essayez d&apos;autres termes ou élargissez vos critères.</p>
          {(searchTerm || selectedCity !== 'all' || selectedServiceId !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCity('all')
                setSelectedServiceId('all')
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredPros.map((pro, index) => {
              const avatarLetter = pro.business_name?.[0]?.toUpperCase() || 'P'
              return (
                <motion.div
                  key={pro.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ delay: index * 0.04 }}
                  className="card-hover bg-white rounded-[24px] border border-[#EDE8F0] shadow-bookmeup-sm overflow-hidden"
                >
                  {/* Card image area */}
                  <div className="h-28 bg-gradient-to-br from-secondary to-[#e8d0f0] flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-2xl font-bold text-white shadow-md">
                      {avatarLetter}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-[#2A1F2D] mb-1 truncate">{pro.business_name}</h3>

                    {pro.city && (
                      <p className="text-xs text-[#7A6B80] mb-3 flex items-center gap-1">
                        <span>📍</span> {pro.city}
                      </p>
                    )}

                    {/* Services */}
                    {pro.services.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {pro.services.slice(0, 3).map((service) => (
                            <span key={service.id} className="chip text-xs">
                              {service.name}
                              {service.price !== null && (
                                <span className="ml-1 font-bold">{service.price}€</span>
                              )}
                            </span>
                          ))}
                          {pro.services.length > 3 && (
                            <span className="chip text-xs bg-[#EDE8F0] text-[#7A6B80]">
                              +{pro.services.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="pt-3 border-t border-[#EDE8F0]">
                      {pro.slug ? (
                        <Button
                          size="sm"
                          className="w-full btn-gradient"
                          onClick={async () => {
                            try {
                              const current = await getCurrentUser()
                              if (!current.user) {
                                router.push(`/auth/login?redirect=/pro/${pro.slug}`)
                                return
                              }
                              router.push(`/pro/${pro.slug}`)
                            } catch {
                              router.push(`/auth/login?redirect=/pro/${pro.slug}`)
                            }
                          }}
                        >
                          Voir la fiche →
                        </Button>
                      ) : (
                        <Button disabled size="sm" variant="outline" className="w-full">
                          Profil indisponible
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

