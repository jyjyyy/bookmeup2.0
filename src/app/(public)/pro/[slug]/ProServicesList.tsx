'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  serviceId?: string | null
  [key: string]: any // Allow additional fields from Firestore
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

interface ProServicesListProps {
  services: Array<{
    id: string
    name?: string
    description?: string
    price?: number
    duration?: number
    serviceId?: string | null
    [key: string]: any
  }>
  proSlug: string
}

export function ProServicesList({ services, proSlug }: ProServicesListProps) {
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Load services catalog to get categories
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/services/catalog')
        if (response.ok) {
          const data = await response.json()
          setCatalogServices(data.services || [])
        }
      } catch (err) {
        console.warn('Failed to load services catalog:', err)
      }
    }
    loadCatalog()
  }, [])

  // Group services by category (reusable logic - same as PRO dashboard)
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
      // Filter out services without required fields
      if (!service.name || service.price === undefined || service.duration === undefined) {
        return
      }

      const category = service.serviceId ? categoryMap.get(service.serviceId) : null
      
      if (category) {
        if (!groups.has(category)) {
          groups.set(category, [])
        }
        groups.get(category)!.push(service as Service)
      } else {
        uncategorized.push(service as Service)
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

  if (services.length === 0) {
    return (
      <Card className="rounded-[32px] p-8 text-center">
        <p className="text-slate-600">
          Aucun service disponible pour le moment.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {groupedServices.map((group) => {
        const isExpanded = expandedCategories.has(group.category)
        return (
          <div
            key={group.category}
            className="border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-bookmeup-sm"
          >
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-[#2A1F2D]">
                {group.category} ({group.services.length})
              </h3>
              <svg
                className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 pb-6 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {group.services.map((service) => (
                    <Card
                      key={service.id}
                      className="rounded-[32px] p-6 flex flex-col justify-between h-full transition-shadow hover:shadow-bookmeup-lg"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-[#2A1F2D] mb-2">
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>

                      {/* Bandeau prix + durée */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-2xl font-bold text-primary">
                            {service.price} €
                          </span>
                        </div>
                        <div className="text-xs uppercase text-slate-500 font-medium tracking-wide">
                          {service.duration} min
                        </div>
                      </div>

                      {/* Boutons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/service/${service.id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full rounded-[32px]">
                            Détails
                          </Button>
                        </Link>
                        <Link
                          href={`/booking/${proSlug}?service_id=${service.id}`}
                          className="flex-1"
                        >
                          <Button className="w-full rounded-[32px]">
                            Réserver
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

