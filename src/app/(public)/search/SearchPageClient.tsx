'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { SearchPro, SearchService } from '@/app/api/pros/search/route'

export function SearchPageClient() {
  const [pros, setPros] = useState<SearchPro[]>([])
  const [filteredPros, setFilteredPros] = useState<SearchPro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | 'all'>('all')
  const [selectedService, setSelectedService] = useState<string | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Filter pros based on search term, city, and service
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

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter((pro) => pro.city === selectedCity)
    }

    // Filter by service
    if (selectedService !== 'all') {
      filtered = filtered.filter((pro) =>
        pro.services.some((service) => service.name === selectedService)
      )
    }

    setFilteredPros(filtered)
  }, [pros, searchTerm, selectedCity, selectedService])

  // Extract unique cities
  const cities = Array.from(
    new Set(pros.map((p) => p.city).filter(Boolean) as string[])
  ).sort()

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
        <div className="flex flex-wrap gap-3">
          {/* City Filter */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as string | 'all')}
              className="w-full px-4 py-3 rounded-[32px] bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 text-sm"
            >
              <option value="all">📍 Toutes les villes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
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
        <p className="text-sm text-gray-600">
          {filteredPros.length} professionnelle{filteredPros.length > 1 ? 's' : ''} trouvée{filteredPros.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Results */}
      {filteredPros.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 text-lg">
            Aucune pro ne correspond à ta recherche pour le moment.
          </p>
          {(searchTerm || selectedCity !== 'all' || selectedService !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCity('all')
                setSelectedService('all')
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

