'use client'

import { Card } from '@/components/ui/card'
import { groupServicesByCategory, getCategoryLabel } from '@/lib/serviceUtils'
import type { BookingService } from '../types'

interface ServiceSelectorProps {
  services: BookingService[]
  selectedServiceId: string | null
  onSelectService: (id: string) => void
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelectService,
}: ServiceSelectorProps) {
  // Si un seul service, afficher une card "Service sélectionné"
  if (services.length === 1) {
    const service = services[0]
    return (
      <Card className="rounded-[32px] p-6 bg-secondary/30 border-2 border-primary">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#2A1F2D] mb-1">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                {service.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-primary font-bold text-lg">
                {service.price} €
              </span>
              <span className="text-slate-500">
                {service.duration} min
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Group services by category
  const groupedServices = groupServicesByCategory(services)

  // Sinon, afficher la liste de services groupés par catégorie
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#2A1F2D] mb-4">
        Choisis un service
      </h2>
      
      {groupedServices.map((categoryGroup) => (
        <div key={categoryGroup.category} className="space-y-3">
          {/* Category Title */}
          <h3 className="text-lg font-semibold text-[#2A1F2D] flex items-center gap-2">
            <span className="text-xl">
              {categoryGroup.category === 'ongles' && '💅'}
              {categoryGroup.category === 'coiffure_femme' && '💇‍♀️'}
              {categoryGroup.category === 'coiffure_homme' && '💇‍♂️'}
              {categoryGroup.category === 'coiffure_enfant' && '👶'}
              {categoryGroup.category === 'regard' && '👁️'}
              {categoryGroup.category === 'soins_visage' && '✨'}
              {categoryGroup.category === 'soins_corps' && '🧴'}
              {categoryGroup.category === 'massages' && '💆'}
              {categoryGroup.category === 'épilation' && '🪒'}
              {categoryGroup.category === 'maquillage' && '💄'}
              {categoryGroup.category === 'services_spécifiques' && '🎯'}
              {!['ongles', 'coiffure_femme', 'coiffure_homme', 'coiffure_enfant', 'regard', 'soins_visage', 'soins_corps', 'massages', 'épilation', 'maquillage', 'services_spécifiques'].includes(categoryGroup.category) && '📋'}
            </span>
            {categoryGroup.label}
          </h3>
          
          {/* Services Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {categoryGroup.services.map((service) => {
              const isSelected = selectedServiceId === service.id
              return (
                <button
                  key={service.id}
                  onClick={() => onSelectService(service.id)}
                  className={`text-left transition-all rounded-[32px] p-6 border-2 ${
                    isSelected
                      ? 'bg-secondary border-primary shadow-bookmeup'
                      : 'bg-white border-gray-200 hover:border-primary hover:shadow-bookmeup-sm'
                  }`}
                >
                  <h4 className="text-lg font-semibold text-[#2A1F2D] mb-1">
                    {service.name}
                  </h4>
                  {service.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-xl">
                      {service.price} €
                    </span>
                    <span className="text-xs text-slate-500 uppercase">
                      {service.duration} min
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

