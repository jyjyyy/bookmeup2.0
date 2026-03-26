'use client'

import { Card } from '@/components/ui/card'
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
      <div className="bg-secondary rounded-[24px] p-5 border-2 border-primary/40">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Prestation sélectionnée</p>
            <h3 className="text-base font-bold text-[#2A1F2D] mb-1">{service.name}</h3>
            {service.description && (
              <p className="text-sm text-[#7A6B80] mb-2 line-clamp-2">{service.description}</p>
            )}
            <div className="flex items-center gap-4">
              <span className="text-primary font-extrabold text-lg">{service.price} €</span>
              <span className="text-sm text-[#7A6B80]">⏱ {service.duration} min</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sinon, afficher la liste de services
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[#2A1F2D]">Choisissez une prestation</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id
          return (
            <button
              key={service.id}
              onClick={() => onSelectService(service.id)}
              className={`text-left transition-all rounded-[20px] p-5 border-2 card-hover ${
                isSelected
                  ? 'bg-secondary border-primary shadow-bookmeup-sm'
                  : 'bg-white border-[#EDE8F0] hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#2A1F2D] mb-1 truncate">{service.name}</h3>
                  {service.description && (
                    <p className="text-xs text-[#7A6B80] mb-2 line-clamp-2">{service.description}</p>
                  )}
                  <span className="text-xs text-[#7A6B80]">⏱ {service.duration} min</span>
                </div>
                <span className={`text-lg font-extrabold flex-shrink-0 ${isSelected ? 'text-primary' : 'text-[#2A1F2D]'}`}>
                  {service.price} €
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

